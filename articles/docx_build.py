# Word versions of the articles: one section per page, a page-size background image in each
# section's header (so the colour covers the margins), right-to-left paragraphs, David and Arial.
import json, os, sys
from docx import Document
from docx.shared import Mm, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.section import WD_SECTION
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
data = json.load(open(src))
os.remove(src)
pages = data['pages']
bg_dir = os.path.join(out, '.bg'); os.makedirs(bg_dir, exist_ok=True)

def bg_image(color):
    p = os.path.join(bg_dir, color.strip('#') + '.png')
    if not os.path.exists(p): Image.new('RGB', (420, 594), color).save(p)
    return p

def hexrgb(h): h = h.strip('#'); return RGBColor(int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))

def rtl(par):
    pPr = par._p.get_or_add_pPr()
    b = OxmlElement('w:bidi'); b.set(qn('w:val'), '1'); pPr.append(b)
    par.alignment = WD_ALIGN_PARAGRAPH.LEFT  # "start" in a bidi paragraph

def run(par, text, size, color, font='Arial', bold=False):
    r = par.add_run(text); r.font.size = Pt(size); r.font.color.rgb = hexrgb(color); r.bold = bold
    r.font.name = font
    rPr = r._r.get_or_add_rPr(); rf = rPr.find(qn('w:rFonts'))
    if rf is None: rf = OxmlElement('w:rFonts'); rPr.append(rf)
    for k in ('w:ascii', 'w:hAnsi', 'w:cs'): rf.set(qn(k), font)
    cs = OxmlElement('w:rtl'); rPr.append(cs)
    return r

def para(doc, text, size=10, color='#111111', font='Arial', bold=False, space=4):
    p = doc.add_paragraph(); rtl(p); p.paragraph_format.space_after = Pt(space)
    run(p, text, size, color, font, bold); return p

def background(section, color):
    section.header.is_linked_to_previous = False
    hp = section.header.paragraphs[0]
    r = hp.add_run(); pic = r.add_picture(bg_image(color), width=Mm(210), height=Mm(297))
    # turn the inline picture into an anchored one behind the text, at the page origin
    inline = pic._inline
    anchor = OxmlElement('wp:anchor')
    for k, v in dict(distT='0', distB='0', distL='0', distR='0', simplePos='0', relativeHeight='0', behindDoc='1', locked='1', layoutInCell='1', allowOverlap='1').items(): anchor.set(k, v)
    sp = OxmlElement('wp:simplePos'); sp.set('x', '0'); sp.set('y', '0'); anchor.append(sp)
    for tag, rel in (('wp:positionH', 'page'), ('wp:positionV', 'page')):
        e = OxmlElement(tag); e.set('relativeFrom', rel); o = OxmlElement('wp:posOffset'); o.text = '0'; e.append(o); anchor.append(e)
    for child in list(inline):
        if child.tag.endswith('extent'): anchor.append(child)
    wrap = OxmlElement('wp:wrapNone'); anchor.append(wrap)
    for child in list(inline):
        if not child.tag.endswith('extent'): anchor.append(child)
    inline.getparent().replace(inline, anchor)

def new_section(doc, i, first=False):
    s = doc.sections[0] if first else doc.add_section(WD_SECTION.NEW_PAGE)
    s.page_width, s.page_height = Mm(210), Mm(297)
    for m in ('left_margin', 'right_margin', 'top_margin', 'bottom_margin'): setattr(s, m, Mm(12))
    s.header_distance = Mm(0)
    background(s, pages[i]['bg'])
    return pages[i]

for a in data['list']:
    doc = Document()
    base = os.path.dirname(os.path.join(out, 'x'))
    def path(rel): return os.path.normpath(os.path.join(out, rel))
    # page 1
    c = new_section(doc, 0, True)
    try: doc.add_picture(path(a['cover']['img']), width=Mm(186))
    except Exception: pass
    para(doc, f"{a['cover']['kind']} · {a['cover']['caption']}", 7, c['soft'])
    para(doc, a['kicker'], 8, c['soft'])
    para(doc, a['title'][0], 30, c['fg'], 'David')
    para(doc, a['title'][1], 30, c['fg'], 'David', True)
    para(doc, a['dek'], 11, c['fg'])
    para(doc, f"{data['meta']['BYLINE']} · {data['meta']['MACHINE']}", 8, c['soft'])
    # page 2
    c = new_section(doc, 1)
    for n, ch in enumerate(a['chapters'][:2], 1):
        para(doc, f"0{n}  {ch['h']}", 16, c['fg'], 'David', True)
        for b in ch['body']: para(doc, b, 10, c['fg'])
        para(doc, ch['insight'], 12, c['fg'], 'David', True, 10)
    para(doc, a['quote']['text'], 15, c['fg'], 'David')
    para(doc, a['quote']['src'], 8, c['soft'])
    # page 3
    c = new_section(doc, 2)
    ch = a['chapters'][2]
    para(doc, f"03  {ch['h']}", 16, c['fg'], 'David', True)
    for b in ch['body']: para(doc, b, 10, c['fg'])
    para(doc, ch['insight'], 12, c['fg'], 'David', True, 10)
    try: doc.add_picture(path(a['strip'][-1]), width=Mm(110))
    except Exception: pass
    for k, v in a['numbers']: para(doc, f"{k}: {v}", 10, c['fg'], 'Arial', False, 2)
    para(doc, 'מה זה לא', 8, c['soft']); para(doc, a['notIs'], 10, c['fg'])
    # page 4
    c = new_section(doc, 3)
    para(doc, 'מה זה אומר לתכנון', 8, c['soft'])
    for i, s in enumerate(a['steps'], 1): para(doc, f"{i}. {s}", 10.5, c['fg'])
    para(doc, a['question'], 14, c['fg'], 'David', True, 10)
    para(doc, 'הייקו', 8, c['soft'])
    for line in a['haiku']: para(doc, line, 13, c['fg'], 'David', False, 0)
    para(doc, 'מקורות', 8, c['soft'])
    for s in a['sources']: para(doc, s, 8, c['soft'], 'Arial', False, 1)
    doc.save(os.path.join(out, f"{a['id']}.docx"))
print('docx', len(data['list']))
