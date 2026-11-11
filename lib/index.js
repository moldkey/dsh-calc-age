/**
 * 年龄计算器
 *
 * 从生日算周岁、虚岁、生肖、星座，以及距离下次生日还有几天。纯本地计算，不联网。
 */

export const name = "dsh-calc-age";

export const inject = ["tools"];

const TEXT_OUTPUT = {
  schema: {
    type: "object",
    additionalProperties: false,
    properties: {
      text: { type: "string" },
    },
    required: ["text"],
  },
  render: (_args, value) => [
    { type: "text", text: (value && value.text) || "" },
  ],
};

// ══════════════════════════════════════════════════════════
//  通用工具函数
// ══════════════════════════════════════════════════════════

const TITLE = "__CALC_TITLE__";

function fmt(n, digits) {
  if (!Number.isFinite(n)) return String(n);
  const d = digits == null ? 2 : digits;
  if (Math.abs(n) >= 1e12) return n.toExponential(6);
  let s = n.toFixed(d);
  if (d > 0) s = s.replace(/0+$/, "").replace(/\.$/, "");
  return s;
}

function money(n) {
  if (!Number.isFinite(n)) return String(n);
  return n.toLocaleString("zh-CN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function num(v, def) {
  const n = Number(v);
  return Number.isFinite(n) ? n : (def == null ? 0 : def);
}

function line(label, value, unit) {
  const pad = "  ";
  return pad + label + "：" + value + (unit ? " " + unit : "");
}

function head(title) {
  return [title, "=".repeat(52)];
}

// ══════════════════════════════════════════════════════════
//  工具
// ══════════════════════════════════════════════════════════

export function apply(ctx, config) {
  void config;

  ctx.tools.register({
    name: "calc_age",
    description:
      "年龄计算。输入出生日期，返回周岁、虚岁、生肖、星座、下次生日倒计时。",
    parameters: {
      birthday: { type: "string", required: true, description: "出生日期 YYYY-MM-DD" },
    },
    output: TEXT_OUTPUT,
    async execute(args) {
      try {
        const a = args || {};
        const m = String(a.birthday || "").match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
        if (!m) return { text: "生日格式要 YYYY-MM-DD" };
        const by = +m[1], bm = +m[2], bd = +m[3];
        const now = new Date();
        const ty = now.getFullYear(), tm = now.getMonth() + 1, td = now.getDate();
        let age = ty - by;
        if (tm < bm || (tm === bm && td < bd)) age--;
        const lunar = age + 1;
        const L = head("年龄计算");
        L.push(line("生日", by + "-" + String(bm).padStart(2,"0") + "-" + String(bd).padStart(2,"0")));
        L.push(line("今天", ty + "-" + String(tm).padStart(2,"0") + "-" + String(td).padStart(2,"0")));
        L.push(line("周岁", age + " 岁"));
        L.push(line("虚岁", lunar + " 岁（周岁+1）"));
        L.push("");
        // 生肖（以 1900 年鼠年为基准）
        const ZODIAC = ["鼠","牛","虎","兔","龙","蛇","马","羊","猴","鸡","狗","猪"];
        L.push("  生肖：" + ZODIAC[((by - 1900) % 12 + 12) % 12]);
        // 星座
        const signs = [[1,20,"水瓶"],[2,19,"双鱼"],[3,21,"白羊"],[4,20,"金牛"],
                       [5,21,"双子"],[6,22,"巨蟹"],[7,23,"狮子"],[8,23,"处女"],
                       [9,23,"天秤"],[10,24,"天蝎"],[11,23,"射手"],[12,22,"摩羯"]];
        let sign = "摩羯";
        for (const [sm, sd, name] of signs) {
          if (bm === sm && bd >= sd) sign = name;
          if (bm === sm + 1 && bd < sd) sign = name;
        }
        if (bm === 1 && bd < 20) sign = "摩羯";
        L.push("  星座：" + sign);
        L.push("");
        // 下次生日
        const next = new Date(ty, bm - 1, bd);
        if (next < now) next.setFullYear(ty + 1);
        const dd = Math.ceil((next - now) / 86400000);
        L.push("  距离下次生日：" + dd + " 天");
        return { text: L.join("\n") };
      } catch (e) {
        return { text: "计算失败: " + String((e && e.message) || e) };
      }
    },
  });
}
