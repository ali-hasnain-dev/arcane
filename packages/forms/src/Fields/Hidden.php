<?php

namespace Larafusion\Fields;

class Hidden extends Field
{
    public function getType(): string { return 'hidden'; }

    // Hidden fields never produce validation rules — they carry computed/preset values.
    public function getRules(): array { return []; }
}
