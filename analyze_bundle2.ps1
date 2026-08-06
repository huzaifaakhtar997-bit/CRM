$file = 'C:\Users\Huzaifa\.gemini\antigravity\brain\9e1a9417-1475-4d84-8cd0-98ddc23eddd0\.system_generated\steps\291\content.md'
$content = Get-Content $file -Raw

$patterns = @(
    'Unified Inbox',
    'Campaigns',
    'Integration',
    'HubSpot Sync',
    '/inbox',
    '/campaigns',
    '/team',
    '/reports',
    '/integrations',
    'firstName',
    'lastName',
    'email',
    'phone',
    'jobTitle',
    'leadStatus',
    'leadSource',
    'industry',
    'revenue',
    'amount',
    'closeDate',
    'stageId',
    'stageName',
    'priority',
    'dueDate',
    'assignedTo',
    'subject',
    'previewText',
    'Kanban',
    'Won',
    'Lost',
    'Qualified',
    'Proposal',
    'Negotiation',
    'Lead',
    'Opportunity',
    'totalRevenue',
    'winRate',
    'conversionRate',
    'action=add',
    'action=edit',
    'isOpen',
    'showModal',
    'Add Contact',
    'Add Deal',
    'New Contact',
    'New Deal',
    'Edit Contact',
    'Import',
    'Export',
    'filterBy',
    'sortBy',
    'searchTerm',
    'notification',
    'inbox',
    'message',
    'template',
    'emailSettings',
    'smtpServer',
    'senderName',
    'resetDemoData',
    'companyName',
    'website',
    'industry',
    'employees',
    'annualRevenue'
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
