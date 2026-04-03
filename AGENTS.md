# AGENTS.md

## 專案概要

這是一個「個人閱讀紀錄網站」，用來整理與展示已讀書籍與系列作品。

目前專案是純前端靜態網站：

- 使用 Vue 3 與 Vite
- 不使用後端
- 不使用資料庫
- 不依賴 server-side API
- 所有資料都儲存在專案內的靜態 JSON 檔案

代理在進行任何實作時，必須優先維持「可直接部署為靜態網站」這個前提。

---

## 目前專案重點

目前專案已經完成的核心方向如下：

- 以 `src/data/raw/books.json` 作為唯一人工維護資料來源
- 透過 `scripts/build-books.js` 產生 `src/data/generated/books.json`
- 前端只讀取 `generated/books.json`
- 支援單一本書與系列書兩種資料格式
- 支援單一關鍵字搜尋、作者篩選、類型篩選、日期區間篩選、排序
- 系列書可在列表中展開查看各集資料

後續代理修改此專案時，應以延續這套資料流與互動方式為優先，不要把資料流程改回前端直接清理 raw 資料，也不要引入不必要的新資料來源。

---

## 視覺與介面基準

### 目前畫面風格

目前畫面不是「暖色獨立書店編輯風」，而是較接近以下方向：

- Fluent UI 深色模式延伸
- 深色、安靜、穩定
- 帶有低調藍色 accent 的閱讀介面
- 半透明 surface 搭配輕微模糊背景
- 內容導向，不是 dashboard，但也不是過度裝飾的藝文站

因此後續調整 UI 時，應優先延續目前已存在的視覺語言：

- 深色背景與高可讀性淺色文字
- 藍色系 accent
- 細邊框、低對比 surface、克制陰影
- 書名作為主要視覺焦點
- 列表為主，不做厚重卡片牆

避免：

- 改成亮色主題
- 改成霓虹科技感
- 改成米色書店風或大幅切換設計語言
- 加入過強動畫、發光、玻璃擬態堆疊

### 目前介面配置

目前首頁配置基準如下：

- 頂部有 hero 區塊，顯示站點標題與簡短說明
- hero 下方是常駐的搜尋與篩選區
- 搜尋框固定顯示在上方，不是獨立浮層
- 篩選條件區預設收合，透過按鈕展開
- 列表結果顯示在下方，空狀態獨立呈現

代理不要把互動基準假設成以下未實作設計：

- `/` 開啟搜尋
- `Esc` 關閉搜尋
- 右下角 fixed 搜尋按鈕
- 全畫面搜尋浮層

除非使用者明確要求，否則不要主動把目前常駐搜尋列改成浮層式搜尋體驗。

### 動效基準

目前允許的動效風格：

- 搜尋條件區 collapse 展開/收合
- 系列書分集展開/收合
- 輕微的 opacity、background、border-color、translateY 變化

避免：

- 大幅位移
- 彈跳動畫
- 長時間過場
- 干擾閱讀節奏的特效

---

## 目前資料結構

### 原始資料檔

唯一人工維護來源：

- `src/data/raw/books.json`

原始資料目前支援兩種格式。

1. 單本書
2. 系列書

單本書至少包含：

- `title`
- `author`
- `category`
- `readDate`

系列書至少包含：

- `title`
- `author`
- `category`
- `volumes`

`volumes[]` 目前欄位：

- `volume`: 必填，字串
- `readDate`: 必填，格式為 `YYYY-MM-DD`
- `subtitle`: 選填，字串

### 產出資料檔

前端實際讀取：

- `src/data/generated/books.json`

build 後產物目前不只是原始資料的拷貝，而是已整理好的前端資料。每筆資料至少包含：

- `id`
- `type`
- `title`
- `author`
- `category`
- `readDate`
- `startReadDate`
- `endReadDate`
- `readYear`
- `readMonth`
- `searchText`
- `volumes`

系列書額外包含：

- `volumeCount`

系列書的 `volumes[]` 目前會被整理成前端可直接顯示的格式，每集至少包含：

- `id`
- `volume`
- `subtitle`
- `readDate`
- `title`
- `searchText`

### 日期與排序語意

目前資料語意如下：

- 單本書的 `readDate`、`startReadDate`、`endReadDate` 相同
- 系列書的 `readDate` 代表該系列最後閱讀日期
- 系列書的 `startReadDate` 與 `endReadDate` 代表整個系列閱讀區間

build 產物的固定排序規則為：

1. `readDate` 由新到舊
2. 若相同，`author` 升冪
3. 若相同，`title` 升冪

---

## Build 資料整理流程

### 目前腳本

資料整理腳本為：

- `scripts/build-books.js`

`package.json` 目前腳本：

- `prepare:data`: 執行 `node scripts/build-books.js`
- `dev`: 先跑 `prepare:data` 再啟動 Vite
- `build`: 先跑 `prepare:data` 再執行正式建置

### 目前 build 腳本職責

`build-books.js` 目前會：

1. 讀取 `src/data/raw/books.json`
2. 驗證根節點必須是陣列
3. 判斷每筆資料是單本書或系列書
4. 驗證必要欄位與日期格式
5. 清理 `title`、`author`、`category`、`volume`、`subtitle` 前後空白
6. 產生穩定 `id`
7. 產生 `searchText`、`readYear`、`readMonth`
8. 對輸出資料做固定排序
9. 寫入 `src/data/generated/books.json`

### 目前驗證規則

build 腳本目前已實作以下檢查：

- `raw/books.json` 必須是合法 JSON
- 根節點必須是陣列
- 每筆資料必須是物件
- `title`、`author`、`category` 必須為非空字串
- 單本書必須有合法 `readDate`
- 系列書不可同時有 `readDate` 與 `volumes`
- 系列書必須有非空 `volumes` 陣列
- 每集 `volume` 必須是非空字串
- 每集 `readDate` 必須是合法 `YYYY-MM-DD`
- 每集 `subtitle` 若存在必須是字串

### 目前重複檢查規則

目前重複檢查不是舊文件中的泛用描述，而是實際以下規則：

- 單本書：`title + author + readDate` 相同會直接失敗
- 系列書：`title + author` 相同會直接失敗
- 系列內分集：`volume + subtitle` 相同會直接失敗

錯誤訊息會優先顯示書名，讓使用者能直接回頭修正 `raw/books.json`。

---

## 前端功能現況

### 目前首頁資料流

目前首頁在 `src/views/HomeView.vue`，資料流如下：

1. 載入 `src/data/generated/books.json`
2. 建立 Fuse 搜尋索引
3. 先套用單一關鍵字搜尋
4. 再套用作者、類型、日期區間篩選
5. 最後套用排序
6. 將結果交給列表元件渲染

請延續這個順序，不要拆成多套互相競爭的狀態來源。

### 目前搜尋與篩選

目前搜尋與篩選規格如下：

- 單一搜尋框同時搜尋 `title`、`author`、`searchText`
- 使用 `fuse.js`
- 搜尋結果即時更新
- 額外有作者下拉篩選
- 額外有類型下拉篩選
- 日期區間使用 `startDate` / `endDate`
- 排序選單支援日期、書名、作者升降冪

注意：目前 UI 已經有「類型」篩選，因此後續文件、元件、文案不應只描述作者與日期。

### 系列書呈現

目前系列書在列表中的呈現方式：

- 主列表先顯示系列名稱、作者、類型、日期區間
- 顯示 `共 n 集`
- 可手動展開各集
- 若搜尋關鍵字命中分集副標題，系列會自動展開

這是目前的實際互動重點，後續若調整列表元件，不要破壞這個行為。

### 結果數量顯示

目前首頁顯示的結果數量是「實際書本數量」：

- 單本書算 1 本
- 系列書會依 `volumes.length` 累加

不要誤改成只計算列表筆數，除非使用者明確要求。

---

## 元件與檔案基準

目前主要檔案如下：

- `src/App.vue`: 掛載首頁視圖
- `src/main.js`: 啟動 Vue 並載入全域樣式
- `src/views/HomeView.vue`: 首頁狀態、搜尋、篩選、排序主邏輯
- `src/components/BookFilters.vue`: 作者、類型、日期、排序、清除條件
- `src/components/BookList.vue`: 清單與空狀態
- `src/components/BookListItem.vue`: 單筆書籍與系列展開互動
- `src/styles.css`: 全站樣式與視覺語言

後續若拆分元件，應以降低複雜度與維持可讀性為前提，不要為拆而拆。

---

## 實作原則

### 變更優先順序

代理實作時，請優先遵守：

1. 維持靜態網站前提
2. 維持 raw -> build script -> generated -> frontend 的資料流
3. 在現有 Fluent 深色語言上做延伸
4. 做最小必要修改
5. 保持元件與狀態簡單

### 不應做的事

- 不要引入後端
- 不要加入資料庫
- 不要改成前端直接讀 raw 資料
- 不要要求使用者手動同步多份資料檔
- 不要加入和需求無關的重依賴
- 不要無故大規模重構現有 UI 結構

### 程式碼風格

- 命名清楚
- 單一職責
- 優先可讀性
- 避免過早抽象
- 衍生資料優先使用 `computed`
- 避免在 template 內堆疊過多複雜邏輯

---

## 後續新增書籍資料的方式

未來新增、修改、刪除書籍時，唯一需要手動編輯的檔案是：

- `src/data/raw/books.json`

新增一本單本書的流程：

1. 打開 `src/data/raw/books.json`
2. 新增一筆物件
3. 填入 `title`、`author`、`category`、`readDate`
4. 儲存檔案
5. 執行 `pnpm run prepare:data`，或直接執行 `pnpm dev` / `pnpm build`

新增系列書時：

1. 在 `raw/books.json` 新增系列物件
2. 填入 `title`、`author`、`category`
3. 在 `volumes` 中填入各集 `volume`、`readDate`，必要時加入 `subtitle`
4. 執行資料整理腳本

不要要求使用者同步修改：

- 前端元件
- 搜尋設定
- 排序邏輯
- 額外索引檔
- 類別對照表

---

## 驗收與維護基準

完成修改後，至少應符合以下條件：

- `src/data/raw/books.json` 仍是唯一人工維護來源
- `scripts/build-books.js` 仍可產出 `src/data/generated/books.json`
- 前端仍只讀 `generated/books.json`
- 單一本書與系列書都能正常顯示
- 搜尋、作者篩選、類型篩選、日期區間、排序可以同時作用
- 系列展開互動仍正常
- `generated/books.json` 為空陣列時頁面不崩潰
- `raw/books.json` 格式錯誤時 build 會失敗並給出可理解訊息
- UI 延續目前深色 Fluent 風格，而不是改成其他視覺體系

---

## 代理工作方式

當代理修改此專案時，請遵守以下原則：

- 先理解現有專案結構與目前畫面，再做修改
- 優先更新與現況不符的文件，而不是沿用舊假設
- 在回應中明確說明改了哪些檔案
- 若新增檔案，名稱需直接反映用途
- 若有多種可行方案，優先選擇最簡單穩定的一種
- 除非被要求，否則不要加入與需求無關的功能
- 除非被要求，否則不要進行大規模重構

---

## 完成任務時的輸出要求

代理完成實作後，回報內容應包含：

- 修改或新增的檔案
- build 資料整理流程如何運作
- 前端實際讀取哪個資料檔
- 目前視覺風格如何對應現有 Fluent 深色介面
- 如何在本機啟動
- 如何新增一本新書資料
- 是否有已知限制
