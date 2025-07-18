# config-js 学習ドキュメント

## 概要
config-jsは設定ファイルを管理するためのJavaScriptライブラリです。アプリケーションの設定を外部ファイルから読み込み、環境に応じた設定の切り替えを簡単に行うことができます。

## 基本的な使用方法

### 1. インストール
```bash
npm install config-js
```

### 2. 基本的な設定ファイル構造
config-jsは`config/`ディレクトリ内の設定ファイルを自動的に読み込みます。

```
project/
├── config/
│   ├── default.json
│   ├── development.json
│   ├── production.json
│   └── test.json
├── package.json
└── app.js
```

### 3. 設定ファイルの作成

#### config/default.json
```json
{
  "app": {
    "name": "My Application",
    "version": "1.0.0",
    "port": 3000
  },
  "database": {
    "host": "localhost",
    "port": 5432,
    "name": "myapp_db"
  },
  "logging": {
    "level": "info",
    "file": "app.log"
  }
}
```

#### config/development.json
```json
{
  "app": {
    "port": 3001
  },
  "database": {
    "name": "myapp_dev_db"
  },
  "logging": {
    "level": "debug"
  }
}
```

#### config/production.json
```json
{
  "app": {
    "port": 8080
  },
  "database": {
    "host": "prod-db.example.com",
    "name": "myapp_prod_db"
  },
  "logging": {
    "level": "warn",
    "file": "/var/log/myapp.log"
  }
}
```

### 4. アプリケーションでの使用

#### app.js
```javascript
import config from 'config-js';

// 設定値の取得
const appName = config.get('app.name');
const dbHost = config.get('database.host');
const port = config.get('app.port');

console.log(`アプリケーション名: ${appName}`);
console.log(`データベースホスト: ${dbHost}`);
console.log(`ポート: ${port}`);

// デフォルト値付きで取得
const timeout = config.get('app.timeout', 5000);
console.log(`タイムアウト: ${timeout}ms`);
```

## 高度な使用方法

### 1. 環境変数の使用
```json
{
  "app": {
    "port": "${PORT:3000}",
    "secret": "${APP_SECRET}"
  },
  "database": {
    "url": "${DATABASE_URL}"
  }
}
```

### 2. 設定の階層化
```javascript
// 深い階層の設定にアクセス
const dbConfig = config.get('database');
const logLevel = config.get('logging.level');

// 設定の存在チェック
if (config.has('feature.enabled')) {
  const featureEnabled = config.get('feature.enabled');
}
```

### 3. 動的な設定変更
```javascript
// 設定値の更新
config.set('app.port', 4000);

// 設定の追加
config.set('newFeature.enabled', true);
```

### 4. 複数の設定ファイル形式
config-jsは複数の形式をサポートしています：

#### YAML形式 (config/default.yaml)
```yaml
app:
  name: My Application
  port: 3000
database:
  host: localhost
  port: 5432
```

#### JavaScript形式 (config/default.js)
```javascript
export default {
  app: {
    name: 'My Application',
    port: process.env.PORT || 3000
  },
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT) || 5432
  }
};
```

## 環境別設定の切り替え

### 1. NODE_ENV による自動切り替え
```bash
# 開発環境
NODE_ENV=development node app.js

# 本番環境
NODE_ENV=production node app.js

# テスト環境
NODE_ENV=test node app.js
```

### 2. 明示的な環境指定
```javascript
import config from 'config-js';

// 特定の環境の設定を読み込み
const devConfig = config.loadConfig('development');
const prodConfig = config.loadConfig('production');
```

## 実践的な例

### Express.js アプリケーション
```javascript
import express from 'express';
import config from 'config-js';

const app = express();

// 設定から値を取得
const port = config.get('app.port');
const dbUrl = config.get('database.url');

// データベース接続
import mongoose from 'mongoose';
mongoose.connect(dbUrl);

// サーバー起動
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
```

### React アプリケーション
```javascript
import config from 'config-js';

// API エンドポイントの設定
const API_BASE_URL = config.get('api.baseUrl');
const API_VERSION = config.get('api.version');

// API クライアントの作成
class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
    this.version = API_VERSION;
  }

  async fetchData(endpoint) {
    const url = `${this.baseUrl}/v${this.version}/${endpoint}`;
    const response = await fetch(url);
    return response.json();
  }
}
```

## ベストプラクティス

### 1. 設定の構造化
```json
{
  "app": {
    "name": "myapp",
    "version": "1.0.0",
    "debug": false
  },
  "server": {
    "host": "localhost",
    "port": 3000,
    "ssl": false
  },
  "database": {
    "type": "mongodb",
    "host": "localhost",
    "port": 27017,
    "name": "myapp_db",
    "options": {
      "useUnifiedTopology": true
    }
  }
}
```

### 2. 機密情報の管理
```javascript
// 機密情報は環境変数から取得
const config = {
  database: {
    password: process.env.DB_PASSWORD,
    apiKey: process.env.API_KEY
  }
};
```

### 3. 設定のバリデーション
```javascript
import config from 'config-js';

// 必須設定のチェック
const requiredConfig = ['database.host', 'database.name', 'app.port'];
for (const key of requiredConfig) {
  if (!config.has(key)) {
    throw new Error(`Required configuration missing: ${key}`);
  }
}
```

## トラブルシューティング

### 1. よくあるエラー
```javascript
// 設定が見つからない場合
try {
  const value = config.get('nonexistent.key');
} catch (error) {
  console.error('設定が見つかりません:', error.message);
}

// デフォルト値を使用
const value = config.get('nonexistent.key', 'default-value');
```

### 2. デバッグ情報の出力
```javascript
// 現在の設定を確認
console.log('現在の設定:', config.getAll());

// 設定の読み込み順序を確認
console.log('読み込み順序:', config.getLoadOrder());
```

## まとめ
config-jsは柔軟で強力な設定管理ライブラリです。環境別の設定管理、階層化された設定、複数の設定ファイル形式のサポートなど、多くの機能を提供します。適切に使用することで、アプリケーションの設定を効率的に管理できます。