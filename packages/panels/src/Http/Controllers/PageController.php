<?php

namespace Larafusion\Http\Controllers;

use Illuminate\Routing\Controller;
use Larafusion\LarafusionManager;

class PageController extends Controller
{
    public function show(string $page)
    {
        $pageClass = LarafusionManager::resolvePage($page);
        return $pageClass::render();
    }
}
