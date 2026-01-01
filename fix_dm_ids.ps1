
$path = 'C:\Users\Azeem\Documents\github\Mcom\McomLoyalty\src\app\dashboard\my-assets\group-circles\page.tsx'
$content = Get-Content $path -Raw

# 1. Update Member interface
$content = $content -replace 'interface Member \{(\s+)id: string;', 'interface Member {$1id: string;$1memberId: string;'

# 2. Update mapping logic in useMemo
$oldMapping = '                    id: m.id,'
$newMapping = '                    id: m.network.id,`n                    memberId: m.id,'
# Using a more unique string for replacement
$content = $content.Replace('                    id: m.id,', '                    id: m.network.id,`n                    memberId: m.id,')

# 3. Update handleRemoveMember
$content = $content.Replace('memberId: activeMember.id', 'memberId: activeMember.memberId')

# 4. Update myMemberId logic to use network.id for consistency if we want to match the radar "id"
# But wait, the radar identifies "ME" via currentMemberId.
# If members[x].id is now network.id, then currentMemberId must be the owner's network.id.

# Let's find the owner's network id in myMemberId calculation
$oldMyMemberId = 'return matchedMember?.id;'
$newMyMemberId = 'return matchedMember?.id;' # We keep this because matchedMember.id is now network.id
$content = $content.Replace('return matchedMember?.id;', 'return matchedMember?.id;')

$content | Set-Content $path -Encoding UTF8
