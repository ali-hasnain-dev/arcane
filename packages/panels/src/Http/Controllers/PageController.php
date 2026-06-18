<?php

namespace Arcane\Http\Controllers;

use Illuminate\Routing\Controller;
use Arcane\ArcaneManager;

class PageController extends Controller
{
    public function show(string $page)
    {
        $pageClass = ArcaneManager::resolvePage($page);
        return $pageClass::render();
    }
}
