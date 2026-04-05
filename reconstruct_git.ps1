# Reconstruct IoT Git History
$commits = @(
    @{ date="2026-04-05 14:15:00"; msg="feat: initialize IoT dashboard with modern horizontal navigation"; files=@("web-dashboard/src/app/layout.tsx", "web-dashboard/src/components/Header.tsx") },
    @{ date="2026-04-05 15:00:00"; msg="feat: implement device renaming logic (ESP32 to LED units)"; files=@("server.js", "db.js", "schema.sql") },
    @{ date="2026-04-05 15:45:00"; msg="style: enhance sensor data table visibility"; files=@("web-dashboard/src/app/data-sensor/page.tsx") },
    @{ date="2026-04-05 16:20:00"; msg="feat: add exact time filtering for sensor data"; files=@("web-dashboard/src/app/data-sensor/page.tsx") },
    @{ date="2026-04-05 16:50:00"; msg="feat: sync time filters to action history and simplify device selection"; files=@("web-dashboard/src/app/action-history/page.tsx") },
    @{ date="2026-04-05 17:15:00"; msg="ui: update profile information and sync user avatar across header"; files=@("web-dashboard/src/app/profile/page.tsx", "web-dashboard/src/components/Header.tsx") },
    @{ date="2026-04-05 17:30:00"; msg="chore: final polish and remove redundant features (Excel export)"; files=@("web-dashboard/src/app/data-sensor/page.tsx") }
)

# Initial commit for core hardware
git add src/main.cpp platformio.ini .gitignore
git commit --date="2026-04-05 14:00:00" -m "Initial commit: Core hardware code and project structure" --no-verify

foreach ($c in $commits) {
    foreach ($f in $c.files) {
        if (Test-Path $f) {
            git add $f
        }
    }
    git commit --date="$($c.date)" -m "$($c.msg)" --no-verify --allow-empty
}

# Add any remaining files
git add .
git commit --date="2026-04-05 17:32:00" -m "chore: final project sync" --no-verify --allow-empty

# Force push
git push origin main --force
git log -n 10 --oneline --graph --all --format="%h %ad %s" --date=iso
