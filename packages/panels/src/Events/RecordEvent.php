<?php

namespace Arcane\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;
use Arcane\ArcaneManager;

class RecordEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(
        public readonly string $event,
        public readonly string $resource,
        public readonly mixed  $payload,
    ) {}

    public function broadcastOn(): array
    {
        $panel   = ArcaneManager::getPanel();
        $channel = $panel ? $panel->getRealtimeChannel() : 'arcane';

        return [
            new Channel("{$channel}.{$this->resource}"),
        ];
    }

    public function broadcastAs(): string
    {
        return "arcane.record.{$this->event}";
    }

    public function broadcastWith(): array
    {
        return [
            'event'    => $this->event,
            'resource' => $this->resource,
            'payload'  => is_object($this->payload) ? $this->payload->toArray() : $this->payload,
        ];
    }
}
