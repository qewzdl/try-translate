FROM libretranslate/libretranslate:latest

RUN pip install --no-cache-dir argostranslate

RUN python - <<'PY'
import argostranslate.package

argostranslate.package.update_package_index()
available = argostranslate.package.get_available_packages()

needed = [("ru", "en"), ("en", "ru")]

for from_code, to_code in needed:
    pkg = next(
        (p for p in available if p.from_code == from_code and p.to_code == to_code),
        None
    )
    if pkg is None:
        raise Exception(f"Package not found: {from_code}->{to_code}")

    print(f"Installing {from_code}->{to_code}")
    path = pkg.download()
    argostranslate.package.install_from_path(path)

print("Russian packages installed")
PY