import { ArcaneField, FormValues } from '@arcane/core';

// ─── Rules that can be validated 100% client-side ─────────────────────────────
const CLIENT_RULES = new Set([
    'required', 'string', 'integer', 'numeric', 'boolean',
    'email', 'url', 'ip', 'ipv4', 'ipv6', 'uuid', 'ulid',
    'alpha', 'alpha_num', 'alpha_dash', 'ascii',
    'min', 'max', 'between',
    'digits', 'digits_between', 'min_digits', 'max_digits',
    'regex', 'not_regex',
    'confirmed', 'same', 'different', 'filled',
    'in', 'not_in',
    'gt', 'gte', 'lt', 'lte',
    'starts_with', 'ends_with', 'doesnt_start_with', 'doesnt_end_with',
    'hex_color', 'json', 'mac_address', 'multiple_of',
    'after', 'after_or_equal', 'before', 'before_or_equal',
    'size',
]);

// ─── Rules that MUST go to the server ────────────────────────────────────────
const SERVER_RULES = new Set([
    'unique', 'exists',
    'prohibited', 'prohibited_if', 'prohibited_unless', 'prohibits',
    'required_if', 'required_if_accepted', 'required_unless',
    'required_with', 'required_with_all', 'required_without', 'required_without_all',
    'sometimes', 'nullable',
    'active_url',
]);

export interface ClassifiedRules {
    client: string[];
    server: string[];
    hasServerRules: boolean;
}

export function classifyRules(rules: string[]): ClassifiedRules {
    const client: string[] = [];
    const server: string[] = [];

    for (const rule of rules) {
        const base = rule.split(':')[0].toLowerCase();
        if (SERVER_RULES.has(base)) {
            server.push(rule);
        } else {
            client.push(rule);
        }
    }

    return { client, server, hasServerRules: server.length > 0 };
}

// ─── Client-side validation runner ───────────────────────────────────────────

export function runClientValidation(
    field: ArcaneField,
    value: unknown,
    rules: string[],
    allValues: Record<string, unknown> = {},
): string | undefined {
    const displayLabel   = field.validation?.attribute ?? field.label;
    const customMessages = field.validation?.messages;

    for (const rule of rules) {
        const [name, ...parts] = rule.split(':');
        const param = parts.join(':');
        const error = validateRule(name.toLowerCase(), value, param, displayLabel, allValues);
        if (error) {
            const custom = customMessages?.[name.toLowerCase()];
            if (custom) return custom.replace(':attribute', displayLabel.toLowerCase());
            return error;
        }
    }
    return undefined;
}

function validateRule(
    rule: string,
    value: unknown,
    param: string,
    label: string,
    allValues: Record<string, unknown>
): string | undefined {
    const str     = value === null || value === undefined ? '' : String(value).trim();
    const isEmpty = str === '' || value === null || value === undefined
                 || (Array.isArray(value) && value.length === 0);

    switch (rule) {

        // ── Presence ─────────────────────────────────────────────────────────
        case 'required':
            if (isEmpty) return `The ${label} field is required.`;
            break;

        case 'filled':
            if (value !== undefined && value !== null && isEmpty)
                return `The ${label} field must not be empty when present.`;
            break;

        // ── Type ─────────────────────────────────────────────────────────────
        case 'email':
            if (!isEmpty && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str))
                return `The ${label} field must be a valid email address.`;
            break;

        case 'url':
            if (!isEmpty) {
                try { new URL(str); } catch { return `The ${label} field must be a valid URL.`; }
            }
            break;

        case 'numeric':
        case 'integer':
            if (!isEmpty && isNaN(Number(str)))
                return `The ${label} field must be a number.`;
            break;

        case 'string':
            if (!isEmpty && typeof value !== 'string')
                return `The ${label} field must be a string.`;
            break;

        case 'boolean':
            if (!isEmpty && !['true','false','1','0'].includes(str.toLowerCase()))
                return `The ${label} field must be true or false.`;
            break;

        case 'json':
            if (!isEmpty) {
                try { JSON.parse(str); } catch { return `The ${label} field must be a valid JSON string.`; }
            }
            break;

        // ── Network ──────────────────────────────────────────────────────────
        case 'ip':
            if (!isEmpty && !isIPv4(str) && !isIPv6(str))
                return `The ${label} field must be a valid IP address.`;
            break;

        case 'ipv4':
            if (!isEmpty && !isIPv4(str))
                return `The ${label} field must be a valid IPv4 address.`;
            break;

        case 'ipv6':
            if (!isEmpty && !isIPv6(str))
                return `The ${label} field must be a valid IPv6 address.`;
            break;

        case 'mac_address':
            if (!isEmpty && !/^([0-9A-Fa-f]{2}[:\-]){5}([0-9A-Fa-f]{2})$/.test(str))
                return `The ${label} field must be a valid MAC address.`;
            break;

        // ── String format ─────────────────────────────────────────────────────
        case 'alpha':
            if (!isEmpty && !/^[a-zA-Z]+$/.test(str))
                return `The ${label} field may only contain letters.`;
            break;

        case 'alpha_num':
            if (!isEmpty && !/^[a-zA-Z0-9]+$/.test(str))
                return `The ${label} field may only contain letters and numbers.`;
            break;

        case 'alpha_dash':
            if (!isEmpty && !/^[a-zA-Z0-9_-]+$/.test(str))
                return `The ${label} field may only contain letters, numbers, dashes, and underscores.`;
            break;

        case 'ascii':
            if (!isEmpty && !/^[\x00-\x7F]+$/.test(str))
                return `The ${label} field may only contain ASCII characters.`;
            break;

        case 'hex_color':
            if (!isEmpty && !/^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(str))
                return `The ${label} field must be a valid hex color (e.g. #fff or #ffffff).`;
            break;

        case 'uuid':
            if (!isEmpty && !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str))
                return `The ${label} field must be a valid UUID.`;
            break;

        case 'ulid':
            if (!isEmpty && !/^[0-7][0-9A-HJKMNP-TV-Z]{25}$/i.test(str))
                return `The ${label} field must be a valid ULID.`;
            break;

        // ── String matching ──────────────────────────────────────────────────
        case 'starts_with': {
            const prefixes = param.split(',');
            if (!isEmpty && !prefixes.some(p => str.startsWith(p)))
                return `The ${label} field must start with one of: ${prefixes.join(', ')}.`;
            break;
        }

        case 'ends_with': {
            const suffixes = param.split(',');
            if (!isEmpty && !suffixes.some(s => str.endsWith(s)))
                return `The ${label} field must end with one of: ${suffixes.join(', ')}.`;
            break;
        }

        case 'doesnt_start_with': {
            const prefixes = param.split(',');
            if (!isEmpty && prefixes.some(p => str.startsWith(p)))
                return `The ${label} field must not start with: ${prefixes.join(', ')}.`;
            break;
        }

        case 'doesnt_end_with': {
            const suffixes = param.split(',');
            if (!isEmpty && suffixes.some(s => str.endsWith(s)))
                return `The ${label} field must not end with: ${suffixes.join(', ')}.`;
            break;
        }

        // ── Numeric bounds ────────────────────────────────────────────────────
        case 'min': {
            const min = Number(param);
            if (!isEmpty) {
                if (typeof value === 'number' || (!isNaN(Number(str)) && str !== '')) {
                    if (Number(str) < min) return `The ${label} field must be at least ${min}.`;
                } else {
                    if (str.length < min) return `The ${label} field must be at least ${min} characters.`;
                }
            }
            break;
        }

        case 'max': {
            const max = Number(param);
            if (!isEmpty) {
                if (typeof value === 'number' || (!isNaN(Number(str)) && str !== '')) {
                    if (Number(str) > max) return `The ${label} field may not be greater than ${max}.`;
                } else {
                    if (str.length > max) return `The ${label} field may not be greater than ${max} characters.`;
                }
            }
            break;
        }

        case 'between': {
            const [lo, hi] = param.split(',').map(Number);
            const num = Number(str);
            if (!isEmpty && (isNaN(num) || num < lo || num > hi))
                return `The ${label} field must be between ${lo} and ${hi}.`;
            break;
        }

        case 'size': {
            const size = Number(param);
            if (!isEmpty && str.length !== size)
                return `The ${label} field must be ${size} characters.`;
            break;
        }

        case 'min_digits':
            if (!isEmpty && str.replace(/\D/g, '').length < Number(param))
                return `The ${label} field must have at least ${param} digits.`;
            break;

        case 'max_digits':
            if (!isEmpty && str.replace(/\D/g, '').length > Number(param))
                return `The ${label} field may not have more than ${param} digits.`;
            break;

        case 'digits':
            if (!isEmpty && (!/^\d+$/.test(str) || str.length !== Number(param)))
                return `The ${label} field must be exactly ${param} digits.`;
            break;

        case 'multiple_of': {
            const n   = Number(param);
            const num = Number(str);
            if (!isEmpty && n !== 0 && num % n !== 0)
                return `The ${label} field must be a multiple of ${n}.`;
            break;
        }

        // ── Cross-field numeric comparison ────────────────────────────────────
        case 'gt': {
            const other = Number(allValues[param] ?? 0);
            if (!isEmpty && Number(str) <= other)
                return `The ${label} field must be greater than ${param}.`;
            break;
        }

        case 'gte': {
            const other = Number(allValues[param] ?? 0);
            if (!isEmpty && Number(str) < other)
                return `The ${label} field must be greater than or equal to ${param}.`;
            break;
        }

        case 'lt': {
            const other = Number(allValues[param] ?? 0);
            if (!isEmpty && Number(str) >= other)
                return `The ${label} field must be less than ${param}.`;
            break;
        }

        case 'lte': {
            const other = Number(allValues[param] ?? 0);
            if (!isEmpty && Number(str) > other)
                return `The ${label} field must be less than or equal to ${param}.`;
            break;
        }

        // ── Date comparison ───────────────────────────────────────────────────
        case 'after': {
            const ref = parseDate(param);
            const val = parseDate(str);
            if (!isEmpty && val && ref && val <= ref)
                return `The ${label} field must be a date after ${param}.`;
            break;
        }

        case 'after_or_equal': {
            const ref = parseDate(param);
            const val = parseDate(str);
            if (!isEmpty && val && ref && val < ref)
                return `The ${label} field must be a date after or equal to ${param}.`;
            break;
        }

        case 'before': {
            const ref = parseDate(param);
            const val = parseDate(str);
            if (!isEmpty && val && ref && val >= ref)
                return `The ${label} field must be a date before ${param}.`;
            break;
        }

        case 'before_or_equal': {
            const ref = parseDate(param);
            const val = parseDate(str);
            if (!isEmpty && val && ref && val > ref)
                return `The ${label} field must be a date before or equal to ${param}.`;
            break;
        }

        // ── Cross-field string ────────────────────────────────────────────────
        case 'same': {
            const other = allValues[param];
            if (!isEmpty && str !== String(other ?? ''))
                return `The ${label} field must match ${param}.`;
            break;
        }

        case 'different': {
            const other = allValues[param];
            if (!isEmpty && str === String(other ?? ''))
                return `The ${label} field and ${param} must be different.`;
            break;
        }

        // ── List membership ───────────────────────────────────────────────────
        case 'in': {
            const allowed = param.split(',');
            if (!isEmpty && !allowed.includes(str))
                return `The selected ${label.toLowerCase()} is invalid.`;
            break;
        }

        case 'not_in': {
            const forbidden = param.split(',');
            if (!isEmpty && forbidden.includes(str))
                return `The selected ${label.toLowerCase()} is invalid.`;
            break;
        }

        // ── Pattern ───────────────────────────────────────────────────────────
        case 'regex': {
            try {
                const m       = param.match(/^\/(.+)\/([gimsuy]*)$/);
                const pattern = m ? new RegExp(m[1], m[2]) : new RegExp(param);
                if (!isEmpty && !pattern.test(str))
                    return `The ${label} field format is invalid.`;
            } catch { /* invalid regex — skip */ }
            break;
        }

        case 'not_regex': {
            try {
                const m       = param.match(/^\/(.+)\/([gimsuy]*)$/);
                const pattern = m ? new RegExp(m[1], m[2]) : new RegExp(param);
                if (!isEmpty && pattern.test(str))
                    return `The ${label} field format is invalid.`;
            } catch { /* invalid regex — skip */ }
            break;
        }

        // ── Confirmation ──────────────────────────────────────────────────────
        case 'confirmed':
            // Handled at form level; skip here
            break;
    }

    return undefined;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function isIPv4(str: string): boolean {
    return /^(\d{1,3}\.){3}\d{1,3}$/.test(str) &&
        str.split('.').every(n => Number(n) >= 0 && Number(n) <= 255);
}

function isIPv6(str: string): boolean {
    return /^[0-9a-f:]+$/i.test(str) && str.includes(':');
}

function parseDate(str: string): Date | null {
    if (!str) return null;
    const d = new Date(str);
    return isNaN(d.getTime()) ? null : d;
}
