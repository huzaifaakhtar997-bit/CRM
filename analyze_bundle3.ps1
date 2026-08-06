$file = 'C:\Users\Huzaifa\.gemini\antigravity\brain\9e1a9417-1475-4d84-8cd0-98ddc23eddd0\.system_generated\steps\291\content.md'
$content = Get-Content $file -Raw

$patterns = @(
    'closeDate',
    'lifecycleStage',
    'stageName',
    'probability',
    'winProbability',
    'Won',
    'Lost',
    'Qualified',
    'Proposal Sent',
    'Negotiation',
    'Opportunity',
    'Subject',
    'dueDate',
    'completed',
    'notification',
    'unread',
    'thread',
    'compose',
    'sequence',
    'block',
    'emailSettings',
    'smtpServer',
    'senderEmail',
    'fieldMapping',
    'syncStatus',
    'lastSync',
    'connected',
    'Administrator',
    'Sales Representative',
    'Manager',
    'Marketing User',
    'Support',
    'role',
    'avatar',
    'assignedUserId',
    'assignedUserName',
    'Total Contacts',
    'Total Deals',
    'Total Revenue',
    'Win Rate',
    'New Contacts',
    'Open Deals',
    'Tasks Due',
    'Pipeline Value',
    'Bar chart',
    'Line chart',
    'Area chart',
    'Pie chart',
    'AreaChart',
    'BarChart',
    'LineChart',
    'PieChart',
    'import',
    'export',
    'csv',
    'bulk',
    'confirm',
    'delete',
    'archive'
)

foreach ($p in $patterns) {
    $escaped = [regex]::Escape($p)
    $regex = ".{0,100}$escaped.{0,100}"
    $matchResults = [regex]::Matches($content, $regex)
    if ($matchResults.Count -gt 0) {
        Write-Host "=== $p ==="
        $matchResults | Select-Object -First 3 | ForEach-Object { Write-Host $_.Value }
        Write-Host ""
    }
}
