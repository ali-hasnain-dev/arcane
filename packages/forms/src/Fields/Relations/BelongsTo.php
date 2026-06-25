<?php

namespace Larafusion\Fields\Relations;

use Larafusion\Fields\Field;
use Illuminate\Database\Eloquent\Model;

class BelongsTo extends Field
{
    protected string  $relatedModel;
    protected string  $foreignKey;
    protected string  $labelColumn  = 'name';
    protected string  $valueColumn  = 'id';
    protected ?string $searchColumn = null;
    protected bool    $searchable   = true;
    protected bool    $preload      = false;   // preload all options on mount
    protected int     $preloadLimit = 100;
    protected ?string $optionLabel  = null;    // custom label format e.g. "{name} ({email})"
    protected array   $where        = [];      // extra where conditions

    public function __construct(string $name)
    {
        parent::__construct($name);
        // Infer foreign key from field name e.g. "user" → "user_id"
        $this->foreignKey = str_ends_with($name, '_id') ? $name : "{$name}_id";
    }

    public static function make(string $name): static
    {
        return new static($name);
    }

    public function model(string $model): static
    {
        $this->relatedModel = $model;
        return $this;
    }

    public function foreignKey(string $key): static
    {
        $this->foreignKey = $key;
        return $this;
    }

    public function labelColumn(string $column): static
    {
        $this->labelColumn = $column;
        return $this;
    }

    public function valueColumn(string $column): static
    {
        $this->valueColumn = $column;
        return $this;
    }

    public function searchColumn(string $column): static
    {
        $this->searchColumn = $column;
        return $this;
    }

    public function optionLabel(string $format): static
    {
        $this->optionLabel = $format;
        return $this;
    }

    public function preload(int $limit = 100): static
    {
        $this->preload      = true;
        $this->preloadLimit = $limit;
        return $this;
    }

    public function where(string $column, mixed $value): static
    {
        $this->where[$column] = $value;
        return $this;
    }

    public function getType(): string  { return 'belongs_to'; }
    public function getRelatedModel(): string { return $this->relatedModel; }
    public function getLabelColumn(): string  { return $this->labelColumn; }
    public function getValueColumn(): string  { return $this->valueColumn; }
    public function getSearchColumn(): string { return $this->searchColumn ?? $this->labelColumn; }
    public function getOptionLabel(): ?string { return $this->optionLabel; }
    public function getWhere(): array         { return $this->where; }
    public function getPreloadLimit(): int    { return $this->preloadLimit; }
    public function shouldPreload(): bool     { return $this->preload; }

    /**
     * Build a query for this relation and return formatted options.
     */
    public function getOptions(?string $search = null, int $limit = 20): array
    {
        $query = ($this->relatedModel)::query();

        foreach ($this->where as $col => $val) {
            $query->where($col, $val);
        }

        if ($search) {
            $searchCol = $this->getSearchColumn();
            $query->where($searchCol, 'like', "%{$search}%");
        }

        return $query->limit($limit)
            ->get()
            ->map(fn(Model $m) => [
                'value' => $m->{$this->valueColumn},
                'label' => $this->formatLabel($m),
            ])
            ->toArray();
    }

    private function formatLabel(Model $model): string
    {
        if (!$this->optionLabel) {
            return (string) $model->{$this->labelColumn};
        }

        // Replace {column} placeholders
        return preg_replace_callback('/\{(\w+)\}/', function ($m) use ($model) {
            return $model->{$m[1]} ?? '';
        }, $this->optionLabel);
    }

    public function toArray(): array
    {
        $data = array_merge(parent::toArray(), [
            'relatedModel'  => $this->relatedModel,
            'foreignKey'    => $this->foreignKey,
            'labelColumn'   => $this->labelColumn,
            'valueColumn'   => $this->valueColumn,
            'searchable'    => $this->searchable,
            'preload'       => $this->preload,
        ]);

        // Preload options if requested
        if ($this->preload) {
            $data['preloadedOptions'] = $this->getOptions(null, $this->preloadLimit);
        }

        return $data;
    }
}
