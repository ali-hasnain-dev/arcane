<?php

namespace Arcane\Console;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class MakeUserCommand extends Command
{
    protected $signature = 'arcane:user
        {--name=        : The user\'s display name}
        {--email=       : The user\'s email address}
        {--password=    : The user\'s password (min 8 chars)}
        {--model=       : Fully-qualified model class (default: App\Models\User)}';

    protected $description = 'Create a new Arcane admin user';

    public function handle(): int
    {
        $name     = $this->option('name')     ?: $this->ask('Name');
        $email    = $this->option('email')    ?: $this->ask('Email');
        $password = $this->option('password') ?: $this->secret('Password');

        $validator = Validator::make(
            compact('name', 'email', 'password'),
            [
                'name'     => ['required', 'string', 'max:255'],
                'email'    => ['required', 'email', 'max:255'],
                'password' => ['required', 'string', 'min:8'],
            ]
        );

        if ($validator->fails()) {
            foreach ($validator->errors()->all() as $err) {
                $this->error($err);
            }
            return self::FAILURE;
        }

        $modelClass = $this->option('model') ?: 'App\\Models\\User';

        if (!class_exists($modelClass)) {
            $this->error("Model class [{$modelClass}] does not exist.");
            return self::FAILURE;
        }

        if ($modelClass::where('email', $email)->exists()) {
            $this->error("A user with the email [{$email}] already exists.");
            return self::FAILURE;
        }

        $user = $modelClass::create([
            'name'     => $name,
            'email'    => $email,
            'password' => Hash::make($password),
        ]);

        $this->info("User created successfully.");
        $this->table(
            ['ID', 'Name', 'Email'],
            [[$user->getKey(), $user->name, $user->email]]
        );

        return self::SUCCESS;
    }
}
