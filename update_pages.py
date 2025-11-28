#!/usr/bin/env python3
"""
Script para actualizar todas las páginas HTML con navbar y dark-mode centralizados
"""
import re
import os

# Páginas a actualizar
pages = [
    'consultoria.html',
    'mantenimiento.html', 
    'recicla.html',
    'asesoramiento-hogar.html',
    'asesoramiento-empresa.html',
    'nosotros.html',
    'contactanos.html',
    'pc-personalizada.html',
    'soporte.html',
    'politica-privacidad.html',
    'terminos-condiciones.html'
]

def update_page(filename):
    """Actualiza una página HTML para usar componentes centralizados"""
    print(f"Actualizando {filename}...")
    
    with open(filename, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # 1. Asegurar que tiene modern-styles.css
    if 'modern-styles.css' not in content:
        content = content.replace(
            '<link href="css/styles.css" rel="stylesheet" />',
            '<link href="css/styles.css" rel="stylesheet" />\n    <link href="css/modern-styles.css" rel="stylesheet" />'
        )
        print(f"  ✓ Agregado modern-styles.css")
    
    # 2. Agregar fetch de navbar si no existe
    if "fetch('navbar.html')" not in content:
        # Buscar el fetch de footer y agregar navbar
        footer_fetch = r"fetch\('footer\.html'\)[^}]+}\);"
        if re.search(footer_fetch, content, re.DOTALL):
            content = re.sub(
                footer_fetch,
                lambda m: m.group(0) + "\n\nfetch('navbar.html')\n  .then(res => res.text())\n  .then(html => {\n    document.getElementById('navbar').innerHTML = html;\n  });",
                content,
                count=1,
                flags=re.DOTALL
            )
            print(f"  ✓ Agregado fetch de navbar")
    
    # 3. Reemplazar navbar inline con <div id="navbar"></div>
    navbar_pattern = r'<nav class="navbar[^>]*>.*?</nav>'
    if re.search(navbar_pattern, content, re.DOTALL):
        content = re.sub(
            navbar_pattern,
            '<div id="navbar"></div>',
            content,
            count=1,
            flags=re.DOTALL
        )
        print(f"  ✓ Reemplazado navbar con div#navbar")
    
    # 4. Eliminar estilos inline de modo oscuro y otros
    style_pattern = r'<style>.*?</style>'
    styles = re.findall(style_pattern, content, re.DOTALL)
    for style in styles:
        # Solo eliminar si contiene modo-oscuro, icono-servicio, paso, o area
        if any(x in style for x in ['modo-oscuro', 'icono-servicio', '.paso', '.area']):
            content = content.replace(style, '', 1)
            print(f"  ✓ Eliminado estilo inline duplicado")
    
    # 5. Reemplazar script de modo oscuro inline con fetch
    dark_mode_pattern = r'<script>\s*// --- MODO OSCURO GLOBAL ---.*?</script>'
    if re.search(dark_mode_pattern, content, re.DOTALL):
        content = re.sub(
            dark_mode_pattern,
            '''<script>
fetch('dark-mode.html')
  .then(res => res.text())
  .then(html => {
    const script = document.createElement('div');
    script.innerHTML = html;
    document.body.appendChild(script);
  });
</script>''',
            content,
            count=1,
            flags=re.DOTALL
        )
        print(f"  ✓ Reemplazado script de modo oscuro con fetch")
    # Si no tiene el script, agregarlo antes de </body>
    elif "fetch('dark-mode.html')" not in content:
        content = content.replace(
            '</body>',
            '''<script>
fetch('dark-mode.html')
  .then(res => res.text())
  .then(html => {
    const script = document.createElement('div');
    script.innerHTML = html;
    document.body.appendChild(script);
  });
</script>
</body>'''
        )
        print(f"  ✓ Agregado fetch de dark-mode")
    
    # Solo escribir si hubo cambios
    if content != original:
        with open(filename, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"  ✅ {filename} actualizado exitosamente\n")
        return True
    else:
        print(f"  ℹ️  {filename} ya estaba actualizado\n")
        return False

def main():
    """Actualiza todas las páginas"""
    print("=" * 60)
    print("ACTUALIZANDO PÁGINAS HTML")
    print("=" * 60 + "\n")
    
    updated = 0
    for page in pages:
        if os.path.exists(page):
            if update_page(page):
                updated += 1
        else:
            print(f"⚠️  {page} no encontrado\n")
    
    print("=" * 60)
    print(f"COMPLETADO: {updated} páginas actualizadas")
    print("=" * 60)

if __name__ == '__main__':
    main()
