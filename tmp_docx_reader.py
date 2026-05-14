import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

path = Path(r'c:\Users\Alone\OneDrive\Desktop\ANA-vet\ANA-vet_Esquema.docx')
if not path.exists():
    print('FILE NOT FOUND', path)
else:
    with zipfile.ZipFile(path, 'r') as z:
        if 'word/document.xml' in z.namelist():
            data = z.read('word/document.xml')
            root = ET.fromstring(data)
            ns = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
            texts = [node.text for node in root.findall('.//w:t', ns) if node.text]
            print(''.join(texts))
        else:
            print('document.xml missing')
