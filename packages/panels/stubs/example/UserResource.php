<?php

namespace App\Arcane;

use App\Models\User;
use App\Models\Role;
use App\Models\Post;
use App\Models\Team;
use Arcane\Resource;
use Arcane\Fields\Text;
use Arcane\Fields\Email;
use Arcane\Fields\Password;
use Arcane\Fields\Select;
use Arcane\Fields\Toggle;
use Arcane\Fields\Textarea;
use Arcane\Fields\Tags;
use Arcane\Fields\Color;
use Arcane\Fields\Repeater;
use Arcane\Fields\ImageUpload;
use Arcane\Fields\FileUpload;
use Arcane\Fields\Relations\BelongsTo;
use Arcane\Fields\Relations\BelongsToMany;
use Arcane\Fields\Relations\HasMany;
use Arcane\Columns\Column;

class UserResource extends Resource
{
    protected static string $model          = User::class;
    protected static string $navigationIcon = 'users';
    protected static string $recordLabel    = 'User';
    protected static array  $searchable     = ['name', 'email'];
    protected static array  $sortable       = ['id', 'name', 'email', 'created_at'];

    public static function form(): array
    {
        return [
            // ── Phase 2: Core fields ──────────────────────────────────────────
            Text::make('name')->required()->maxLength(255)->placeholder('John Doe'),
            Email::make('email')->required()->unique('users', 'email'),
            Password::make('password')->required()->minLength(8),

            Select::make('role')
                ->required()
                ->options(['admin' => 'Administrator', 'editor' => 'Editor', 'viewer' => 'Viewer']),

            Toggle::make('is_active')->label('Active')->default(true),
            Textarea::make('bio')->maxLength(500)->rows(3),

            // ── Phase 4: Advanced fields ──────────────────────────────────────
            Tags::make('skills')
                ->suggestions(['PHP', 'Laravel', 'React', 'TypeScript', 'Tailwind', 'MySQL'])
                ->maxTags(10),

            Color::make('brand_color')->label('Brand Color')->default('#7c3aed'),

            Repeater::make('social_links')
                ->addLabel('Add Social Link')
                ->maxRows(5)
                ->schema([
                    Select::make('platform')->required()->options([
                        'twitter' => 'Twitter / X', 'github' => 'GitHub',
                        'linkedin' => 'LinkedIn',   'website' => 'Website',
                    ]),
                    Text::make('url')->required()->placeholder('https://'),
                ]),

            // ── Phase 5: File & image uploads ─────────────────────────────────
            ImageUpload::make('avatar')
                ->label('Profile Photo')
                ->disk('public')->directory('avatars')
                ->avatar()->maxSize(2048),

            FileUpload::make('resume')
                ->label('Resume / CV')
                ->disk('public')->directory('documents')
                ->pdf()->maxSize(10240),

            // ── Phase 6: Relation fields ──────────────────────────────────────

            // BelongsTo — async searchable select (e.g. user belongs to a team)
            BelongsTo::make('team_id')
                ->label('Team')
                ->model(Team::class)
                ->labelColumn('name')
                ->optionLabel('{name} ({city})')
                ->searchColumn('name'),

            // BelongsToMany — multi-select with pivot sync (e.g. user has many roles)
            BelongsToMany::make('roles')
                ->label('Roles')
                ->model(Role::class)
                ->labelColumn('name')
                ->preload(50),

            // HasMany — read-only inline table of related records (e.g. user has many posts)
            HasMany::make('posts')
                ->label('Recent Posts')
                ->model(Post::class)
                ->foreignKey('user_id')
                ->displayColumns(['title', 'status', 'created_at'])
                ->limit(5)
                ->relatedResource('posts'),  // links to /admin/posts resource
        ];
    }

    public static function columns(): array
    {
        return [
            Column::image('avatar')->label('Photo')->width('60px'),
            Column::text('name')->sortable()->filterable('text'),
            Column::text('email')->sortable()->filterable('text'),
            Column::make('role')->filterOptions([
                ['label' => 'Administrator', 'value' => 'admin'],
                ['label' => 'Editor',        'value' => 'editor'],
                ['label' => 'Viewer',        'value' => 'viewer'],
            ]),
            Column::boolean('is_active')->label('Active')->filterable('boolean'),
            Column::date('created_at')->label('Joined')->sortable()->filterable('date_range'),
        ];
    }
}
