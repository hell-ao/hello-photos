$root = $PWD.Path;
$assets = Join-Path $root 'assets';
if (-not (Test-Path $assets)) {
    New-Item -ItemType Directory -Path $assets | Out-Null;
}

$cfg = @{};
$tagColors = @('blue', 'red', 'green');

# 遍历一级分类文件夹
Get-ChildItem -Directory $root | Where-Object { $_.Name -ne 'assets' } | ForEach-Object {
    $catFolderName = $_.Name;
    $catPath = $_.FullName;

    # 读取 map.txt
    $mapLabel = $catFolderName;
    $mapUrl = "";
    $mapFile = Join-Path $catPath 'map.txt';
    if (Test-Path $mapFile) {
        $allLines = Get-Content $mapFile -Encoding UTF8 | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' };
        if ($allLines.Count -ge 1) {
            $mapLabel = $allLines[0];
            if ($allLines.Count -ge 2) {
                $mapUrl = $allLines[1..($allLines.Count-1)] -join '';
            }
        }
    }

    $cfg[$catFolderName] = @{
        mapLabel = $mapLabel
        mapUrl   = $mapUrl
        albums   = @()
    };

    # 遍历相册子文件夹
    Get-ChildItem -Directory $catPath | ForEach-Object {
        $groupName = $_.Name;
        $medias = @();
        $cover = '';
        $hasImage = $false;
        $hasVideo = $false;
        $folderPath = $_.FullName;

        # 收集媒体文件：视频在前，图片在后
        $videos = @();
        $images = @();
        Get-ChildItem $folderPath | ForEach-Object {
            $ext = $_.Extension.ToLower();
            $url = "$catFolderName/$groupName/$($_.Name)";
            if ($ext -in '.mp4','.mov','.avi','.mkv') {
                $videos += @{type='video'; url=$url};
                $hasVideo = $true;
            } elseif ($ext -in '.jpg','.jpeg','.png','.gif') {
                $images += @{type='img'; url=$url};
                $hasImage = $true;
            }
        };
        $medias = $videos + $images;

        # 处理封面
        $coverFile = Join-Path $folderPath 'cover.jpg';
        if (Test-Path $coverFile) { Remove-Item $coverFile -Force -ErrorAction SilentlyContinue }

        if ($hasVideo) {
            # 视频相册：生成封面，但不加入媒体列表
            $firstVideo = $videos[0];
            $videoPath = Join-Path $folderPath (Split-Path $firstVideo.url -Leaf);
            $tempFrame = Join-Path $folderPath 'temp_frame.jpg';
            $playButton = Join-Path $folderPath 'play_button.png';

            try {
                Write-Host "🔄 为 $groupName 生成视频封面..." -ForegroundColor Cyan;
                & ffmpeg -y -i $videoPath -ss 00:00:00.5 -vframes 1 `
                    -vf "scale=460:-1,crop=460:720:(iw-460)/2:(ih-720)/2,scale=230:360" `
                    $tempFrame 2>&1 | Out-Null

                Add-Type -AssemblyName System.Drawing
                $playImg = New-Object System.Drawing.Bitmap(80, 80)
                $g = [System.Drawing.Graphics]::FromImage($playImg)
                $g.Clear([System.Drawing.Color]::Transparent)
                $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(220, 255, 255, 255))
                $points = @(
                    [System.Drawing.Point]::new(20, 15),
                    [System.Drawing.Point]::new(20, 65),
                    [System.Drawing.Point]::new(65, 40)
                )
                $g.FillPolygon($brush, $points)
                $g.Dispose()
                $playImg.Save($playButton, [System.Drawing.Imaging.ImageFormat]::Png)
                $playImg.Dispose()

                & ffmpeg -y -i $tempFrame -i $playButton -filter_complex "[0:v][1:v]overlay=(W-w)/2:(H-h)/2" $coverFile 2>&1 | Out-Null
                $cover = "$catFolderName/$groupName/cover.jpg"
            }
            catch {
                # 生成默认封面
                Add-Type -AssemblyName System.Drawing
                $bmp = New-Object System.Drawing.Bitmap(230, 360);
                $g = [System.Drawing.Graphics]::FromImage($bmp);
                $g.Clear([System.Drawing.Color]::Gray);
                $brush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::White);
                $font = New-Object System.Drawing.Font("微软雅黑", 14);
                $g.DrawString("视频相册", $font, $brush, 75, 160);
                $bmp.Save($coverFile, [System.Drawing.Imaging.ImageFormat]::Jpeg);
                $g.Dispose();
                $bmp.Dispose();
                $cover = "$catFolderName/$groupName/cover.jpg";
            }
            finally {
                if (Test-Path $tempFrame) { Remove-Item $tempFrame -Force -ErrorAction SilentlyContinue }
                if (Test-Path $playButton) { Remove-Item $playButton -Force -ErrorAction SilentlyContinue }
            }
        }
        else {
            # 纯图片相册：用第一张图做封面
            if ($images.Count -gt 0) {
                $cover = $images[0].url;
            }
        }

        if ($medias.Count -gt 0) {
            $num = '{0:0000}' -f ($cfg[$catFolderName].albums.Count + 1);

            # 读取 tags.txt
            $tags = @();
            $tagsFile = Join-Path $folderPath 'tags.txt';
            if (Test-Path $tagsFile) {
                $tagLines = Get-Content $tagsFile -Encoding UTF8 | ForEach-Object { $_.Trim() } | Where-Object { $_ -ne '' };
                foreach ($t in $tagLines) {
                    $randomColor = $tagColors | Get-Random;
                    $tags += @{ text = $t; color = $randomColor };
                }
            } else {
                $tags += @{ text = $catFolderName; color = 'blue' };
            }

            $cfg[$catFolderName].albums += @{
                name       = $groupName;
                number     = $num;
                tags       = $tags;
                cover      = $cover;
                medias     = $medias;
                isVideoOnly = (-not $hasImage)
            };
        }
    };
};

# 生成 JS 配置
$json = $cfg | ConvertTo-Json -Depth 10 -Compress;
$outPath = Join-Path $assets 'auto-album-config.js';
Set-Content -Path $outPath -Value "const autoAlbumConfig = $json;" -Encoding UTF8;

Write-Host "`n✅ 脚本执行完成！" -ForegroundColor Green;
Write-Host "👉 效果说明：" -ForegroundColor Cyan;
Write-Host "1. 视频相册详情页只显示视频，不显示封面图" -ForegroundColor Cyan;
Write-Host "2. 混合相册里视频永远排在最前面" -ForegroundColor Cyan;
Write-Host "3. 完全不修改你的 index.html 和 index-DkUqy-WP.js" -ForegroundColor Cyan;