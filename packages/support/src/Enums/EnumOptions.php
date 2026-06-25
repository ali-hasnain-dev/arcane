<?php

namespace Larafusion\Support\Enums;

class EnumOptions
{
    /**
     * Build a value→label options array from a BackedEnum class.
     * Falls back to title-cased case name when HasLabel is not implemented.
     *
     * @param  class-string  $enumClass
     * @return array<string|int, string>
     */
    public static function toOptions(string $enumClass): array
    {
        $options = [];
        foreach ($enumClass::cases() as $case) {
            $value = $case->value ?? $case->name;
            $options[$value] = $case instanceof HasLabel
                ? ($case->getLabel() ?? static::labelFromName($case->name))
                : static::labelFromName($case->name);
        }
        return $options;
    }

    /**
     * Build a value→color map from a BackedEnum that implements HasColor.
     *
     * @param  class-string  $enumClass
     * @return array<string|int, string>
     */
    public static function toColors(string $enumClass): array
    {
        $colors = [];
        foreach ($enumClass::cases() as $case) {
            if (! ($case instanceof HasColor)) continue;
            $color = $case->getColor();
            if ($color === null) continue;
            $value = $case->value ?? $case->name;
            $colors[$value] = $color;
        }
        return $colors;
    }

    /**
     * Build a value→icon map from a BackedEnum that implements HasIcon.
     *
     * @param  class-string  $enumClass
     * @return array<string|int, string>
     */
    public static function toIcons(string $enumClass): array
    {
        $icons = [];
        foreach ($enumClass::cases() as $case) {
            if (! ($case instanceof HasIcon)) continue;
            $icon = $case->getIcon();
            if ($icon === null) continue;
            $value = $case->value ?? $case->name;
            $icons[$value] = $icon;
        }
        return $icons;
    }

    /**
     * Build a value→description map from a BackedEnum that implements HasDescription.
     *
     * @param  class-string  $enumClass
     * @return array<string|int, string>
     */
    public static function toDescriptions(string $enumClass): array
    {
        $descs = [];
        foreach ($enumClass::cases() as $case) {
            if (! ($case instanceof HasDescription)) continue;
            $desc = $case->getDescription();
            if ($desc === null) continue;
            $value = $case->value ?? $case->name;
            $descs[$value] = $desc;
        }
        return $descs;
    }

    /**
     * Verify that the given string is a valid BackedEnum class.
     */
    public static function isEnumClass(string $class): bool
    {
        if (! class_exists($class) && ! interface_exists($class)) return false;
        if (! function_exists('enum_exists')) return false;
        return enum_exists($class);
    }

    private static function labelFromName(string $name): string
    {
        return ucwords(str_replace(['_', '-'], ' ', strtolower($name)));
    }
}
