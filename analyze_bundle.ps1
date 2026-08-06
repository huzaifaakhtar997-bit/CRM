$file = 'C:\Users\Huzaifa\.gemini\antigravity\brain\9e1a9417-1475-4d84-8cd0-98ddc23eddd0\.system_generated\steps\291\content.md'
$content = Get-Content $file -Raw

$patterns = @('Dashboard','Contacts','Companies','Deals','Tasks','Pipeline','Activities','Reports','Settings','/contacts','/deals','/companies','/tasks','/settings','/pipeline','sidebar','modal','filter','Add New','Create Contact','Create Deal','Edit Deal','Delete','Total Revenue','Total Deals','widget','Kanban','Lead','Opportunity','Proposal','Won','Lost','email','phone','firstName','lastName','amount','closeDate','stageId','status','assignedTo','columns','table header','Search contacts','Add contact','New Deal','Add Task','action','Edit','Import','Export')

foreach ($p in $patterns) {
    $escaped = [regex]::Escape($p)
    $regex = ".{0,80}$escaped.{0,80}"
    $matchResults = [regex]::Matches($content, $regex)
    if ($matchResults.Count -gt 0) {
        Write-Host "=== $p ==="
        $matchResults | Select-Object -First 5 | ForEach-Object { Write-Host $_.Value }
        Write-Host ""
    }
}
