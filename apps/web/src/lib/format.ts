export function formatDate(value: string | undefined | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

export function formatDateTime(value: string | undefined | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  return d.toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function relativeTime(value: string | undefined | null): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const diffMs = Date.now() - d.getTime();
  const sec = Math.round(diffMs / 1000);
  if (sec < 60) return `${sec} 秒前`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min} 分钟前`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr} 小时前`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day} 天前`;
  return formatDate(value);
}

export function issueLink(issue: string | undefined): {
  href: string;
  label: string;
} | null {
  if (!issue) return null;
  if (/^https?:\/\//.test(issue)) {
    const m = issue.match(/issues\/(\d+)/);
    return { href: issue, label: m ? `#${m[1]}` : issue };
  }
  const num = issue.replace(/^(?:opshub)?#/, "");
  if (/^\d+$/.test(num)) {
    return {
      href: `https://github.com/gog5-ops/opshub/issues/${num}`,
      label: `#${num}`,
    };
  }
  return { href: issue, label: issue };
}
