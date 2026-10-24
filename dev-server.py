"""Local server for trying Shine in a browser: python3 dev-server.py → http://127.0.0.1:8000/

- never lets the browser keep old copies of files (Cache-Control: no-store)
- answers byte-range requests, so Safari can play video and audio
- logs each request with the browser it came from
"""
import http.server, functools, sys, os, re

ROOT = os.path.dirname(os.path.abspath(__file__))


class Handler(http.server.SimpleHTTPRequestHandler):
    extensions_map = {**http.server.SimpleHTTPRequestHandler.extensions_map, ".m4a": "audio/mp4", ".mp4": "video/mp4"}

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s UA=%s\n" % (self.log_date_time_string(), fmt % args, self.headers.get("User-Agent")))

    # Photos page helper: POST /__use?file=<name>&variant=<n> copies _variants/<stem>-<n>.jpg
    # over the app's picture. Only for local development; only inside assets/images.
    def do_POST(self):
        from urllib.parse import urlparse, parse_qs
        import shutil
        u = urlparse(self.path)
        if u.path != "/__use":
            self.send_error(404)
            return
        q = parse_qs(u.query)
        name = os.path.basename(q.get("file", [""])[0])
        n = re.sub(r"\D", "", q.get("variant", [""])[0])
        stem = os.path.splitext(name)[0]
        src = os.path.join(ROOT, "_variants", f"{stem}-{n}.jpg")
        dst = os.path.join(ROOT, "assets", "images", name)
        if not (name and n and os.path.isfile(src) and os.path.isfile(dst)):
            self.send_error(400)
            return
        if dst.lower().endswith(".png"):
            import subprocess
            subprocess.run(["sips", "-s", "format", "png", src, "--out", dst], check=True, capture_output=True)
        else:
            shutil.copyfile(src, dst)
        self.send_response(204)
        self.end_headers()

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def send_head(self):
        rng = self.headers.get("Range")
        path = self.translate_path(self.path)
        if not rng or not os.path.isfile(path):
            return super().send_head()
        m = re.match(r"bytes=(\d*)-(\d*)", rng)
        if not m:
            return super().send_head()
        size = os.path.getsize(path)
        start = int(m.group(1)) if m.group(1) else max(0, size - int(m.group(2) or 0))
        end = min(int(m.group(2)) if m.group(1) and m.group(2) else size - 1, size - 1)
        if start > end:
            self.send_error(416)
            return None
        f = open(path, "rb")
        f.seek(start)
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Content-Range", "bytes %d-%d/%d" % (start, end, size))
        self.send_header("Content-Length", str(end - start + 1))
        self.send_header("Accept-Ranges", "bytes")
        self.end_headers()
        self._remaining = end - start + 1
        return f

    def copyfile(self, source, outputfile):
        left = getattr(self, "_remaining", None)
        if left is None:
            return super().copyfile(source, outputfile)
        while left > 0:
            chunk = source.read(min(65536, left))
            if not chunk:
                break
            outputfile.write(chunk)
            left -= len(chunk)
        self._remaining = None


if __name__ == "__main__":
    handler = functools.partial(Handler, directory=ROOT)
    http.server.ThreadingHTTPServer(("127.0.0.1", 8000), handler).serve_forever()
