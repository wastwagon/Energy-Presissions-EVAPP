#!/usr/bin/env python3
"""Deprecated Pillow graphic — use frontend/scripts/render-play-feature-graphic.sh instead."""
import subprocess
import sys
from pathlib import Path

root = Path(__file__).resolve().parent.parent
sh = root / "frontend" / "scripts" / "render-play-feature-graphic.sh"
out = Path.home() / "Downloads" / "clean-motion-play-feature-graphic.png"
if len(sys.argv) > 1:
    out = Path(sys.argv[1]).expanduser()
subprocess.run(["/bin/bash", str(sh), str(out)], check=True)
