console.log(process.env);
export default defineNitroConfig({
  preset: "cloudflare-pages",
  minify: false,
  commonJS: {
    requireReturnsDefault: "preferred", // fix: telegraf export in cloudflare didn't work
  },
  storage: {
    kv: {
      driver: "cloudflare-kv-binding",
      binding: "KV_SETTINGS",
    },
  },
  devStorage: {
    kv: {
      driver: "fs",
      base: "./.nitro/db",
    },
  },
  typescript: {
    strict: true,
    tsConfig: {
      compilerOptions: {
        module: "preserve",
        noEmit: true,
        moduleDetection: "force",
        isolatedModules: true,
        skipLibCheck: true,
      },
    },
  },
});
