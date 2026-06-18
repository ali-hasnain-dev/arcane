<?php

namespace Arcane\TwoFactor;

/**
 * RFC 6238 TOTP implementation. No external dependencies required.
 */
class TwoFactorManager
{
    private const BASE32_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    private const PERIOD       = 30;
    private const DIGITS       = 6;
    private const WINDOW       = 1; // ±1 period tolerance

    // ── Secret generation ─────────────────────────────────────────────────────

    public function generateSecret(int $bytes = 20): string
    {
        return $this->base32Encode(random_bytes($bytes));
    }

    // ── TOTP verification ─────────────────────────────────────────────────────

    public function verifyCode(string $secret, string $code): bool
    {
        if (!preg_match('/^\d{6}$/', $code)) return false;

        $time = (int) floor(time() / self::PERIOD);

        for ($offset = -self::WINDOW; $offset <= self::WINDOW; $offset++) {
            if ($this->computeCode($secret, $time + $offset) === $code) {
                return true;
            }
        }

        return false;
    }

    public function currentCode(string $secret): string
    {
        return $this->computeCode($secret, (int) floor(time() / self::PERIOD));
    }

    // ── QR Code URL (otpauth://) ──────────────────────────────────────────────

    /**
     * Returns a provisioning URI compatible with Google Authenticator.
     * Pass this to a QR-code library to render the setup QR code.
     */
    public function getProvisioningUri(string $secret, string $email, string $issuer): string
    {
        return 'otpauth://totp/' . rawurlencode($issuer . ':' . $email)
            . '?secret=' . $secret
            . '&issuer=' . rawurlencode($issuer)
            . '&algorithm=SHA1'
            . '&digits=' . self::DIGITS
            . '&period=' . self::PERIOD;
    }

    // ── Recovery codes ────────────────────────────────────────────────────────

    public function generateRecoveryCodes(int $count = 8): array
    {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(bin2hex(random_bytes(5))) . '-' . strtoupper(bin2hex(random_bytes(5)));
        }
        return $codes;
    }

    public function verifyRecoveryCode(array $codes, string $input): ?array
    {
        $input = strtoupper(trim($input));
        foreach ($codes as $index => $code) {
            if (hash_equals($code, $input)) {
                array_splice($codes, $index, 1);
                return $codes; // returns remaining codes (used code removed)
            }
        }
        return null;
    }

    // ── Internals ─────────────────────────────────────────────────────────────

    private function computeCode(string $secret, int $timeSlice): string
    {
        $secretBytes = $this->base32Decode($secret);

        // Pack time as 8-byte big-endian (RFC 4226 §5.1)
        $time = pack('N*', 0) . pack('N*', $timeSlice);

        $hmac   = hash_hmac('sha1', $time, $secretBytes, true);
        $offset = ord($hmac[19]) & 0x0f;

        $code = (
            ((ord($hmac[$offset])     & 0x7f) << 24) |
            ((ord($hmac[$offset + 1]) & 0xff) << 16) |
            ((ord($hmac[$offset + 2]) & 0xff) << 8)  |
             (ord($hmac[$offset + 3]) & 0xff)
        ) % (10 ** self::DIGITS);

        return str_pad((string) $code, self::DIGITS, '0', STR_PAD_LEFT);
    }

    private function base32Encode(string $data): string
    {
        $chars  = self::BASE32_CHARS;
        $binary = '';
        foreach (str_split($data) as $byte) {
            $binary .= str_pad(decbin(ord($byte)), 8, '0', STR_PAD_LEFT);
        }
        $binary = str_split(str_pad($binary, (int) ceil(\strlen($binary) / 5) * 5, '0'), 5);
        $output = '';
        foreach ($binary as $chunk) {
            $output .= $chars[bindec($chunk)];
        }
        return $output;
    }

    private function base32Decode(string $data): string
    {
        $chars  = self::BASE32_CHARS;
        $data   = strtoupper(trim($data, '='));
        $binary = '';
        foreach (str_split($data) as $char) {
            $pos     = strpos($chars, $char);
            if ($pos === false) continue;
            $binary .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
        }
        $chunks = str_split($binary, 8);
        $output = '';
        foreach ($chunks as $chunk) {
            if (\strlen($chunk) < 8) break;
            $output .= chr(bindec($chunk));
        }
        return $output;
    }
}
