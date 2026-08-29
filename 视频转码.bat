@echo off
chcp 65001 >nul
echo =====================================
echo 一键转码脚本（HEVC → H.264）
echo =====================================

:: 检查ffmpeg是否在当前目录
if not exist "ffmpeg.exe" (
    echo ❌ 错误：请把ffmpeg.exe和这个脚本放在同一文件夹！
    pause
    exit /b
)

echo 正在扫描当前文件夹及子文件夹中的所有视频文件...
echo.

:: 遍历所有子文件夹里的视频
for /r %%i in (*.mp4 *.mov *.avi *.mkv) do (
    echo 正在处理：%%~fi
    setlocal enabledelayedexpansion
    set "filename=%%~ni"
    set "dirpath=%%~dpi"
    
    :: 输出文件名（原文件名_转码.mp4）
    set "output=!dirpath!!filename!_转码.mp4"
    
    :: 转码命令（H.264 + AAC，兼容所有播放器和浏览器）
    ffmpeg -y -i "%%i" -c:v libx264 -crf 23 -preset medium -c:a aac -b:a 128k "!output!" >nul 2>&1
    
    if exist "!output!" (
        echo ✅ 转码成功：!output!
        :: 可选：转码成功后删除原文件（如果不需要可以注释掉下面这行）
        :: del "%%i"
    ) else (
        echo ❌ 转码失败：%%~fi
    )
    endlocal
)

echo.
echo =====================================
echo 所有视频处理完成！
echo 现在可以运行你的相册生成脚本了
echo =====================================
pause