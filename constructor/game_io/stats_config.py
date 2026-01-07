import re
import json
from pathlib import Path

def parse_stats_config(stats_dir: Path) -> list[dict]:
    config_file = stats_dir / "display_config.js"
    if not config_file.exists():
        return []
    
    text = config_file.read_text(encoding="utf-8")
    
    # Регулярка для извлечения массива конфига
    match = re.search(r"export const STATS_DISPLAY_CONFIG = (\[.*\]);", text, re.S)
    if not match:
        return []
    
    try:
        # Упрощенный парсинг JS-подобного JSON
        content = match.group(1)
        # Заменяем ключи без кавычек на ключи с кавычками для json.loads, если нужно
        # Но в нашем случае мы будем писать валидный JSON-like JS
        cleaned = re.sub(r"(\w+):", r'"\1":', content)
        cleaned = cleaned.replace("'", '"')
        # Удаляем лишние запятые перед закрывающими скобками
        cleaned = re.sub(r",\s*([\]\}])", r"\1", cleaned)
        return json.loads(cleaned)
    except Exception:
        return []

def save_stats_config(stats_dir: Path, config: list[dict]) -> None:
    config_file = stats_dir / "display_config.js"
    
    json_str = json.dumps(config, indent=2, ensure_ascii=False)
    # Превращаем обратно в JS формат (убираем кавычки у ключей для красоты, хотя и с ними ок)
    js_content = f"export const STATS_DISPLAY_CONFIG = {json_str};\n"
    
    config_file.write_text(js_content, encoding="utf-8")
