document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  app.innerHTML = `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; font-family: sans-serif; }
      body { background: #fff; }
      .login { height: 100vh; display: flex; align-items: center; justify-content: center; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
      .login-card { background: #fff; padding: 32px; border-radius: 16px; width: 400px; box-shadow: 0 10px 40px rgba(0,0,0,0.1); }
      .login-title { font-size: 20px; font-weight: bold; margin-bottom: 24px; }
      .login-input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 10px; margin-bottom: 16px; }
      .login-btn { width: 100%; padding: 12px; background: #667eea; color: #fff; border: none; border-radius: 10px; cursor: pointer; }
      .album-page { display: none; padding: 16px; }
      .album-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
      .album-title { font-size: 24px; font-weight: bold; }
      .album-actions { display: flex; gap: 12px; }
      .album-actions span { padding: 8px 16px; border-radius: 8px; cursor: pointer; }
      .album-actions .comment { background: #fff; color: #333; }
      .album-actions .manage { background: #000; color: #fff; }

      .cate-tabs {
        display: flex;
        gap: 10px;
        margin-bottom: 10px;
        padding-bottom: 16px;
        border-bottom: 1px solid #eee;
      }
      .cate-tab {
        padding: 8px 16px;
        border-radius: 20px;
        cursor: pointer;
        background: #f0f0f0;
        border: none;
        font-size: 14px;
      }
      .cate-tab.active { background: #409eff; color: #fff; }

      /* ========== 新地图按钮样式 ========== */
      .location-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        margin-bottom: 16px;
        padding: 6px 12px;
        background: #f0f7ff;
        color: #1677ff;
        border: none;
        border-radius: 6px;
        cursor: pointer;
        font-size: 14px;
      }
      .location-btn::before {
        content: "🗺️";
      }

      .album-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 16px;
        background-color: #f4eae3;
        padding: 16px;
        border-radius: 12px;
      }
      .album-card {
        background: #fff;
        border-radius: 12px;
        overflow: hidden;
        cursor: pointer;
      }
      .album-card img {
        width: 100%;
        aspect-ratio: 300 / 475;
        object-fit: cover;
        display: block;
      }
      .album-info { padding: 12px; }
      .album-name { font-weight: bold; margin-bottom: 8px; }
      .album-number {
        display: inline-block;
        background: #ffb700;
        color: #fff;
        padding: 4px 8px;
        border-radius: 12px;
        font-size: 14px;
        margin-bottom: 10px;
      }
      .album-tags { display: flex; gap: 8px; flex-wrap: wrap; }
      .tag { padding: 4px 8px; border-radius: 6px; font-size: 12px; }
      .tag.blue { background: #e6f2ff; color: #409eff; }
      .tag.red { background: #ffe6e6; color: #f56c6c; }
      .tag.green { background: #e6ffed; color: #67c23a; }

      .detail-page {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #fff;
        overflow-y: auto;
        padding: 16px;
      }
      .back-btn {
        position: sticky;
        top: 0;
        z-index: 10;
        margin-bottom: 16px;
        padding: 10px 16px;
        background: #409eff;
        color: #fff;
        border: none;
        border-radius: 8px;
        cursor: pointer;
      }
      .media-list {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 16px;
        padding-bottom: 20px;
      }
      .media-item {
        width: 100% !important;
        max-width: 100% !important;
        height: auto !important;
        object-fit: contain !important;
        border-radius: 8px;
        display: block;
      }

      .map-page {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: #fff;
        padding: 16px;
      }
      .map-page iframe {
        width: 100%;
        height: calc(100vh - 80px);
        border: none;
        border-radius: 8px;
      }
    </style>

    <div id="loginPage" class="login">
      <div class="login-card">
        <div class="login-title">🔒 私密相册</div>
        <input id="pwdInput" class="login-input" type="password" placeholder="请输入密码">
        <button class="login-btn" onclick="go()">进入</button>
      </div>
    </div>

    <div id="albumPage" class="album-page">
      <div class="album-header">
        <div class="album-title">相册</div>
        <div class="album-actions">
          <span class="comment">留言</span>
          <span class="manage">管理</span>
        </div>
      </div>
      <div id="cateTabs" class="cate-tabs"></div>
      <!-- 新的地图按钮容器 -->
      <div id="locationBtnContainer"></div>
      <div id="albumGrid" class="album-grid"></div>
    </div>

    <div id="detailPage" class="detail-page">
      <button class="back-btn" onclick="back()">← 返回</button>
      <div id="mediaList" class="media-list"></div>
    </div>

    <div id="mapPage" class="map-page">
      <button class="back-btn" onclick="backFromMap()">← 返回</button>
      <iframe id="mapIframe" src=""></iframe>
    </div>
  `;

  const CORRECT_PASSWORD = "135456";
  let allAlbums = {};
  let currentCategory = "";

  function init() {
    if (typeof autoAlbumConfig === 'undefined') {
      alert('未找到配置文件：assets/auto-album-config.js');
      return;
    }
    allAlbums = autoAlbumConfig;
    const cateTabs = document.getElementById("cateTabs");
    cateTabs.innerHTML = "";
    Object.keys(allAlbums).forEach((cat, index) => {
      const tab = document.createElement("button");
      tab.className = `cate-tab ${index === 0 ? "active" : ""}`;
      tab.textContent = cat;
      tab.onclick = () => {
        currentCategory = cat;
        document.querySelectorAll(".cate-tab").forEach(t => t.classList.remove("active"));
        tab.classList.add("active");
        render();
      };
      cateTabs.appendChild(tab);
    });
    // 默认选中第一个分类
    currentCategory = Object.keys(allAlbums)[0];
    render();
  }

  window.go = () => {
    if (document.getElementById("pwdInput").value === CORRECT_PASSWORD) {
      document.getElementById("loginPage").style.display = "none";
      document.getElementById("albumPage").style.display = "block";
    } else {
      alert("密码错误");
    }
  };

  function render() {
    const catData = allAlbums[currentCategory];
    const list = catData?.albums || [];
    const grid = document.getElementById("albumGrid");
    grid.innerHTML = "";

    // ========== ✅ 修复：地图按钮显示 mapLabel 名字 ==========
    const locationBtnContainer = document.getElementById("locationBtnContainer");
    if (catData && catData.mapUrl) {
      locationBtnContainer.innerHTML = `
        <button class="location-btn" onclick="openMap('${catData.mapUrl}')">
          ${catData.mapLabel}  <!-- 这里修复了！ -->
        </button>
      `;
    } else {
      locationBtnContainer.innerHTML = "";
    }

    // 渲染相册列表
    list.forEach(album => {
      const card = document.createElement("div");
      card.className = "album-card";
      card.onclick = () => openDetail(album.medias);

      card.innerHTML = `
        <img src="${album.cover}" alt="${album.name}">
        <div class="album-info">
          <div class="album-name">${album.name}</div>
          <div class="album-number">编号${album.number}</div>
          <div class="album-tags">
            ${album.tags.map(t => `<span class="tag ${t.color}">${t.text}</span>`).join('')}
          </div>
        </div>
      `;
      grid.appendChild(card);
    });
  }

  function openDetail(medias) {
    document.getElementById("albumPage").style.display = "none";
    document.getElementById("detailPage").style.display = "block";
    const ml = document.getElementById("mediaList");
    ml.innerHTML = "";
    medias.forEach(m => {
      if (m.type === "img") {
        ml.innerHTML += `<img src="${m.url}" class="media-item">`;
      } else {
        ml.innerHTML += `<video src="${m.url}" controls class="media-item"></video>`;
      }
    });
  }

  // 打开地图页面
  window.openMap = (url) => {
    document.getElementById("albumPage").style.display = "none";
    document.getElementById("mapPage").style.display = "block";
    document.getElementById("mapIframe").src = url;
  };

  // 从地图页面返回
  window.backFromMap = () => {
    document.getElementById("mapPage").style.display = "none";
    document.getElementById("albumPage").style.display = "block";
  };

  window.back = () => {
    document.getElementById("detailPage").style.display = "none";
    document.getElementById("albumPage").style.display = "block";
  };

  init();
});