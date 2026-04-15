Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

Set-Location $PSScriptRoot

function Ensure-Dir([string]$Path) {
  New-Item -ItemType Directory -Force -Path $Path | Out-Null
}

function Move-IfExists([string]$Source, [string]$Destination) {
  if (Test-Path $Source) {
    $destDir = Split-Path -Parent $Destination
    if ($destDir) { Ensure-Dir $destDir }
    Move-Item -Path $Source -Destination $Destination -Force
    Write-Host "Moved: $Source -> $Destination"
  }
}

@(
  'src', 'src/pages', 'src/components', 'src/components/ui', 'src/components/galaxy',
  'src/components/solarsystem', 'src/components/stars', 'src/hooks', 'src/lib', 'src/data',
  'src/test', 'public', 'archive/legacy', 'docs'
) | ForEach-Object { Ensure-Dir $_ }

if ((Test-Path 'gitignore') -and -not (Test-Path '.gitignore')) {
  Move-Item 'gitignore' '.gitignore' -Force
  Write-Host 'Renamed: gitignore -> .gitignore'
}

foreach ($f in @(
  'placeholder.svg','robots.txt','astronaut-hud.html','_.png','_command-center.png',
  '_command.png','_empire.png','_nope.png','_q.png','_star_testslug.png','_sun-core.png'
)) {
  Move-IfExists $f (Join-Path 'public' ([System.IO.Path]::GetFileName($f)))
}

foreach ($f in @('glassmorphism.tsx.bak','glassmorphism.tsx.bak.20260301-174710','vitest.config (1).ts','use-toast.ts')) {
  Move-IfExists $f (Join-Path 'archive/legacy' ([System.IO.Path]::GetFileName($f)))
}
Move-IfExists 'README.txt' 'docs/README.txt'
Move-IfExists 'plan.md' 'docs/plan.md'

$map = @{
  'App.tsx'='src/App.tsx';
  'App.css'='src/App.css';
  'main.tsx'='src/main.tsx';
  'index.css'='src/index.css';
  'vite-env.d.ts'='src/vite-env.d.ts';
  'Index.tsx'='src/pages/Index.tsx';
  'StarWorld.tsx'='src/pages/StarWorld.tsx';
  'QCore.tsx'='src/pages/QCore.tsx';
  'CommandCenter.tsx'='src/pages/CommandCenter.tsx';
  'CommandDashboard.tsx'='src/pages/CommandDashboard.tsx';
  'EmpireDashboard.tsx'='src/pages/EmpireDashboard.tsx';
  'SunCore.tsx'='src/pages/SunCore.tsx';
  'NotFound.tsx'='src/pages/NotFound.tsx';
  'Command (1).tsx'='src/pages/Command.tsx';
  'ErrorBoundary.tsx'='src/components/ErrorBoundary.tsx';
  'BiometricGate.tsx'='src/components/BiometricGate.tsx';
  'ChatOverlay.tsx'='src/components/ChatOverlay.tsx';
  'ConnectWalletButton.tsx'='src/components/ConnectWalletButton.tsx';
  'ConstellationRing.tsx'='src/components/ConstellationRing.tsx';
  'CouncilChat.tsx'='src/components/CouncilChat.tsx';
  'GalaxyScene.tsx'='src/components/GalaxyScene.tsx';
  'GolGolab.tsx'='src/components/GolGolab.tsx';
  'LanguagePicker.tsx'='src/components/LanguagePicker.tsx';
  'NavLink.tsx'='src/components/NavLink.tsx';
  'SolarSystemScene.tsx'='src/components/SolarSystemScene.tsx';
  'StarWorldTemplate.tsx'='src/components/StarWorldTemplate.tsx';
  'SunCoreChat.tsx'='src/components/SunCoreChat.tsx';
  'SunCoreChatEnhanced.tsx'='src/components/SunCoreChatEnhanced.tsx';
  'SunGateModal.tsx'='src/components/SunGateModal.tsx';
  'TypingMessage.tsx'='src/components/TypingMessage.tsx';
  'Web3ModalProvider.tsx'='src/components/Web3ModalProvider.tsx';
  'GeneticHashChip.tsx'='src/components/GeneticHashChip.tsx';
  'SpaceshipControls.tsx'='src/components/SpaceshipControls.tsx';
  'WarpOverlay.tsx'='src/components/galaxy/WarpOverlay.tsx';
  'ProceduralPlanet.tsx'='src/components/galaxy/ProceduralPlanet.tsx';
  'ParticleTrail.tsx'='src/components/galaxy/ParticleTrail.tsx';
  'InfiniteDepthShader.tsx'='src/components/galaxy/InfiniteDepthShader.tsx';
  'FlightCore.tsx'='src/components/solarsystem/FlightCore.tsx';
  'QSun.tsx'='src/components/solarsystem/QSun.tsx';
  'OrbitingPlanet.tsx'='src/components/solarsystem/OrbitingPlanet.tsx';
  'OrbitRing.tsx'='src/components/solarsystem/OrbitRing.tsx';
  'UserPlanetOrb.tsx'='src/components/solarsystem/UserPlanetOrb.tsx';
  'SpaceshipHUD.tsx'='src/components/solarsystem/SpaceshipHUD.tsx';
  'MobileFlightControls.tsx'='src/components/solarsystem/MobileFlightControls.tsx';
  'QGateModal.tsx'='src/components/solarsystem/QGateModal.tsx';
  'PlanetSeedPanel.tsx'='src/components/solarsystem/PlanetSeedPanel.tsx';
  'TeslaTool.tsx'='src/components/stars/TeslaTool.tsx';
  'MatrixTool.tsx'='src/components/stars/MatrixTool.tsx';
  'MolanaTool.tsx'='src/components/stars/MolanaTool.tsx';
  'DavinciPuzzle.tsx'='src/components/stars/DavinciPuzzle.tsx';
  'BeethovenTool.tsx'='src/components/stars/BeethovenTool.tsx';
  'AgriBioTool.tsx'='src/components/stars/AgriBioTool.tsx';
  'BeethovenAudioTool.tsx'='src/components/stars/BeethovenAudioTool.tsx';
  'OpenWorldTool.tsx'='src/components/stars/OpenWorldTool.tsx';
  'accordion.tsx'='src/components/ui/accordion.tsx';
  'alert-dialog.tsx'='src/components/ui/alert-dialog.tsx';
  'alert.tsx'='src/components/ui/alert.tsx';
  'aspect-ratio.tsx'='src/components/ui/aspect-ratio.tsx';
  'avatar.tsx'='src/components/ui/avatar.tsx';
  'badge.tsx'='src/components/ui/badge.tsx';
  'breadcrumb.tsx'='src/components/ui/breadcrumb.tsx';
  'button.tsx'='src/components/ui/button.tsx';
  'calendar.tsx'='src/components/ui/calendar.tsx';
  'card.tsx'='src/components/ui/card.tsx';
  'carousel.tsx'='src/components/ui/carousel.tsx';
  'chart.tsx'='src/components/ui/chart.tsx';
  'checkbox.tsx'='src/components/ui/checkbox.tsx';
  'collapsible.tsx'='src/components/ui/collapsible.tsx';
  'command.tsx'='src/components/ui/command.tsx';
  'context-menu.tsx'='src/components/ui/context-menu.tsx';
  'dialog.tsx'='src/components/ui/dialog.tsx';
  'drawer.tsx'='src/components/ui/drawer.tsx';
  'dropdown-menu.tsx'='src/components/ui/dropdown-menu.tsx';
  'form.tsx'='src/components/ui/form.tsx';
  'glassmorphism.tsx'='src/components/ui/glassmorphism.tsx';
  'hover-card.tsx'='src/components/ui/hover-card.tsx';
  'input-otp.tsx'='src/components/ui/input-otp.tsx';
  'input.tsx'='src/components/ui/input.tsx';
  'label.tsx'='src/components/ui/label.tsx';
  'menubar.tsx'='src/components/ui/menubar.tsx';
  'navigation-menu.tsx'='src/components/ui/navigation-menu.tsx';
  'pagination.tsx'='src/components/ui/pagination.tsx';
  'popover.tsx'='src/components/ui/popover.tsx';
  'progress.tsx'='src/components/ui/progress.tsx';
  'radio-group.tsx'='src/components/ui/radio-group.tsx';
  'resizable.tsx'='src/components/ui/resizable.tsx';
  'scroll-area.tsx'='src/components/ui/scroll-area.tsx';
  'select.tsx'='src/components/ui/select.tsx';
  'separator.tsx'='src/components/ui/separator.tsx';
  'sheet.tsx'='src/components/ui/sheet.tsx';
  'sidebar.tsx'='src/components/ui/sidebar.tsx';
  'skeleton.tsx'='src/components/ui/skeleton.tsx';
  'slider.tsx'='src/components/ui/slider.tsx';
  'sonner.tsx'='src/components/ui/sonner.tsx';
  'switch.tsx'='src/components/ui/switch.tsx';
  'table.tsx'='src/components/ui/table.tsx';
  'tabs.tsx'='src/components/ui/tabs.tsx';
  'textarea.tsx'='src/components/ui/textarea.tsx';
  'toast.tsx'='src/components/ui/toast.tsx';
  'toaster.tsx'='src/components/ui/toaster.tsx';
  'toggle-group.tsx'='src/components/ui/toggle-group.tsx';
  'toggle.tsx'='src/components/ui/toggle.tsx';
  'tooltip.tsx'='src/components/ui/tooltip.tsx';
  'use-mobile.tsx'='src/hooks/use-mobile.tsx';
  'useAmbientPad.ts'='src/hooks/useAmbientPad.ts';
  'useHUDSettings.ts'='src/hooks/useHUDSettings.ts';
  'useParallax.ts'='src/hooks/useParallax.ts';
  'useTypingEffect.ts'='src/hooks/useTypingEffect.ts';
  'use-toast (1).ts'='src/hooks/use-toast.ts';
  'contentBlocks.ts'='src/data/contentBlocks.ts';
  'starRegistry.ts'='src/data/starRegistry.ts';
  'economy.ts'='src/data/economy.ts';
  'integrations.ts'='src/data/integrations.ts';
  'utils.ts'='src/lib/utils.ts';
  'safeParse.ts'='src/lib/safeParse.ts';
  'validation.ts'='src/lib/validation.ts';
  'i18n.ts'='src/lib/i18n.ts';
  'ownerGate.ts'='src/lib/ownerGate.ts';
  'geneticHash.ts'='src/lib/geneticHash.ts';
  'planetSeeds.ts'='src/lib/planetSeeds.ts';
  'councilEngine.ts'='src/lib/councilEngine.ts';
  'selfHealingMonitor.ts'='src/lib/selfHealingMonitor.ts';
  'qmetaramApi.ts'='src/lib/qmetaramApi.ts';
  'sunCorePrompt.ts'='src/lib/sunCorePrompt.ts';
  'empireStats.ts'='src/lib/empireStats.ts';
  'wagmi.ts'='src/lib/wagmi.ts';
  'setup.ts'='src/test/setup.ts';
  'example.test.ts'='src/test/example.test.ts'
}

foreach ($key in $map.Keys) {
  Move-IfExists $key $map[$key]
}

Write-Host "REORG_OK"
