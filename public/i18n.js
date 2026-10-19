/* Arabic interface. The page is written in English; in Arabic mode every interface string is swapped for its
   Arabic text as it appears (a MutationObserver catches panels built later), the page turns right-to-left, and
   place names switch to their Arabic names. Research text (place histories, documents) stays in its original
   language; the AI answers in the language of the question. */
(function () {
  var KEY = 'atlas.lang';
  function getLang() { try { var v = JSON.parse(localStorage.getItem(KEY)); if (v === 'ar' || v === 'en') return v; } catch (e) {} return /^ar\b/i.test(navigator.language || '') ? 'ar' : 'en'; }
  var LANG = getLang();
  window.ATLAS_LANG = LANG;
  window.ATLAS_SET_LANG = function (l) { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch (e) {} location.reload(); };

  var AR = {
    // header and front door
    'Tripoli: Open Source': 'طرابلس: مصادر مفتوحة',
    'A family record of Tripoli under Gaddafi, 1969–2011': 'سجلّ عائلي لطرابلس في عهد القذافي، 1969–2011',
    'Encyclopedia': 'الموسوعة', 'In memory': 'في الذاكرة', 'Layers': 'الطبقات', 'Add to map': 'أضف إلى الخريطة', 'Settings': 'الإعدادات',
    'Look up': 'بحث', 'Memory': 'ذكرى', 'Add': 'أضف',
    'Tripoli under Gaddafi, 1969–2011': 'طرابلس في عهد القذافي، 1969–2011',
    'Places, events and documents, gathered for the family. Where would you like to start?': 'أماكن وأحداث ووثائق جُمعت للعائلة. من أين تحب أن تبدأ؟',
    'Walk me through it': 'خذني في جولة', 'Short guided stories, one place at a time': 'قصص قصيرة مرشدة، مكانًا بعد مكان',
    'Find a place I knew': 'ابحث عن مكان أعرفه', 'A street, school, prison or neighbourhood': 'شارع أو مدرسة أو سجن أو حيّ',
    'Pick a year': 'اختر سنة', 'See only what happened that year': 'شاهد فقط ما حدث في تلك السنة',
    'Ask a question': 'اطرح سؤالًا', 'In your own words, English or Arabic': 'بكلماتك، بالعربية أو الإنجليزية',
    'Don’t show this again': 'لا تُظهر هذا مرة أخرى', 'Just show me the map': 'اعرض الخريطة فقط',
    'Choose a story': 'اختر قصة', 'Each takes a few minutes. The map moves to each place; tap Next to go on.': 'كل قصة تستغرق دقائق. تنتقل الخريطة إلى كل مكان؛ اضغط «التالي» للمتابعة.',
    'Back': 'رجوع', 'Start': 'ابدأ', 'Next': 'التالي', 'Finish': 'إنهاء', 'End': 'إنهاء', 'Read more': 'اقرأ المزيد',
    'The road to Abu Salim': 'الطريق إلى أبو سليم', '15 April 1986': '15 أبريل 1986', '7 April: the students': '7 أبريل: الطلاب', '2011: Tripoli rises': '2011: طرابلس تنتفض',
    'Tripoli in': 'طرابلس في', 'Show all years': 'اعرض كل السنوات', 'What happened': 'ما الذي حدث', 'Year before': 'السنة السابقة', 'Year after': 'السنة التالية',
    // filters and layers
    'What': 'ماذا', 'When': 'متى', 'How sure': 'مدى اليقين', 'Everything': 'الكل', 'Prisons & security': 'السجون والأمن', 'Killings': 'القتل',
    'War & attacks': 'الحرب والهجمات', 'Power': 'السلطة', 'From': 'من', 'To': 'إلى', 'Gaddafi years': 'سنوات القذافي', 'Before 1969': 'قبل 1969', 'After 2011': 'بعد 2011', 'All years': 'كل السنوات',
    'Documented only': 'الموثّق فقط', 'Plus testimony': 'مع الشهادات',
    'Documented: confirmed by records or several sources. Testimony: reported by witnesses or one source. Everything also shows unconfirmed reports.': 'الموثّق: تؤكده سجلات أو عدة مصادر. الشهادة: يرويها شهود أو مصدر واحد. «الكل» يضيف التقارير غير المؤكدة.',
    'Map style': 'نمط الخريطة', 'Named periods': 'الحقب المسمّاة', 'Pick layers one by one': 'اختر الطبقات واحدة واحدة', 'Display options': 'خيارات العرض',
    'All mapped events, by year': 'كل الأحداث على الخريطة حسب السنة', 'Known but not on the map': 'معروف لكن غير موجود على الخريطة',
    'Show all of Tripoli': 'اعرض طرابلس كلها', 'Done': 'تم', 'Legend': 'دليل الرموز',
    'Light': 'فاتح', 'Dark': 'داكن', 'Satellite': 'قمر صناعي', 'Streets': 'الشوارع', 'Terrain': 'التضاريس', 'Historical': 'تاريخية', 'The Unknown': 'المجهول',
    'Old maps and satellite, 1943–1990': 'خرائط قديمة وصور جوية، 1943–1990', 'People and groups in the files': 'أشخاص وجماعات في الملفات',
    'Then': 'آنذاك', 'Now': 'الآن',
    'Tap a heading to switch the whole group. Tap the small buttons to pick parts of it.': 'اضغط العنوان لتشغيل المجموعة كلها، أو الأزرار الصغيرة لاختيار أجزاء منها.',
    'Prisons, police & security': 'السجون والشرطة والأمن', 'Military & weapons': 'العسكر والأسلحة', 'Killings & attacks': 'القتل والهجمات', 'Power & government': 'السلطة والحكومة',
    'Landmarks & history': 'المعالم والتاريخ', 'Hospitals & universities': 'المستشفيات والجامعات', 'The city today': 'المدينة اليوم', 'Family reports': 'بلاغات العائلة',
    'Prisons': 'السجون', 'Security services': 'الأجهزة الأمنية', 'Police stations': 'مراكز الشرطة', 'Bases': 'القواعد', 'Camps & weapons sites': 'المعسكرات ومواقع الأسلحة', 'Military areas': 'مناطق عسكرية',
    'Killings & repression': 'القتل والقمع', 'Foreign airstrikes': 'الغارات الجوية الأجنبية', 'Ground battles & attacks': 'المعارك والهجمات البرية', 'Seats of power': 'مقار السلطة',
    'Offices & courts': 'المكاتب والمحاكم', 'Embassies': 'السفارات', 'Events & squares': 'الأحداث والساحات', 'Researched buildings': 'مبانٍ مدروسة', 'Monuments & sights': 'النصب والمعالم', 'Mosques': 'المساجد',
    'Hospitals': 'المستشفيات', 'Universities': 'الجامعات', 'Zones': 'المناطق', 'Buildings': 'المباني', 'Water': 'المياه', 'Oil & gas': 'النفط والغاز',
    'Prisons & detention': 'السجون والاحتجاز', 'Security & police': 'الأمن والشرطة', 'Military installations': 'منشآت عسكرية', "Gaddafi's residences & seats of power": 'مساكن القذافي ومقار السلطة', 'Landmarks & events': 'معالم وأحداث',
    'Shown on the map': 'المعروض على الخريطة', 'How to read the pins': 'كيف تقرأ الرموز', 'Solid pin: documented': 'رمز ممتلئ: موثّق', 'White pin: reported, not confirmed': 'رمز أبيض: مُبلغ عنه، غير مؤكد',
    'Dashed circle: how far off the position could be': 'دائرة متقطعة: مقدار الخطأ المحتمل في الموقع', 'Brown building: researched profile': 'مبنى بني: ملف مدروس', 'Teardrop: added by family, not verified': 'دبوس قطرة: أضافته العائلة، غير مُتحقق منه',
    'Family reports (today)': 'بلاغات العائلة (اليوم)',
    // place panel
    'Why it matters': 'لماذا يهم', 'What is known': 'ما هو معروف', 'Linked places': 'أماكن مرتبطة', 'Sources': 'المصادر', 'Details': 'تفاصيل', 'In the archive': 'في الأرشيف',
    'Evidence': 'الدليل', 'Category': 'الفئة', 'Active': 'فترة النشاط', 'Accuracy': 'الدقة', 'Coordinates': 'الإحداثيات', 'Reference': 'المرجع', 'Note': 'ملاحظة',
    'Documented': 'موثّق', 'Named in testimony · area only': 'ورد في شهادات · المنطقة فقط', 'Reported · not confirmed': 'مُبلغ عنه · غير مؤكد', 'Context': 'سياق',
    'Outside the Gaddafi era (1969–2011)': 'خارج عهد القذافي (1969–2011)', 'Street-level 3D view': 'منظر ثلاثي الأبعاد من الشارع', 'Zoom to this place': 'قرّب إلى هذا المكان',
    'Ask about this': 'اسأل عن هذا', 'Ask next': 'اسأل بعد ذلك', 'Or type your own question': 'أو اكتب سؤالك', 'More questions ↻': 'أسئلة أخرى ↻', 'Ask about another spot': 'اسأل عن موقع آخر',
    'No documents in the archive mention this yet.': 'لا توجد بعد وثائق في الأرشيف تذكر هذا.', 'Loading documents…': 'جارٍ تحميل الوثائق…', 'Open the original': 'افتح الأصل', 'Read the full text': 'اقرأ النص كاملًا',
    'Open in archive': 'افتحه في الأرشيف', 'Full text': 'النص الكامل', 'Places mentioned': 'الأماكن المذكورة', 'Summary': 'ملخص', 'Source': 'المصدر', 'Date': 'التاريخ',
    'No family notes yet. Know something about this place?': 'لا توجد ملاحظات عائلية بعد. هل تعرف شيئًا عن هذا المكان؟', 'Remember someone': 'تذكّر شخصًا',
    'Nearby': 'قريب', 'Mapped places nearby': 'أماكن قريبة على الخريطة', 'Known sites nearby': 'مواقع معروفة قريبة', 'District': 'الحيّ', 'Map details': 'تفاصيل الخريطة',
    'Why are these connected?': 'لماذا يرتبط هذان؟', 'What the sources show': 'ما تُظهره المصادر', 'What they do not show': 'ما لا تُظهره', 'In their words': 'بكلماتهم', 'Background': 'خلفية', 'Still open': 'ما زال مفتوحًا', 'As recorded': 'كما سُجّل',
    'Read the passage': 'اقرأ المقطع', 'Hide the passage': 'أخفِ المقطع', 'From our archived copy. The highlighted sentence is the one that best matches this place; read the original to check the context.': 'من نسختنا المؤرشفة. الجملة المظلّلة هي الأقرب إلى هذا المكان؛ اقرأ الأصل للتحقق من السياق.',
    'Where did you live?': 'أين كنت تسكن؟', 'Mark your old home and see what happened nearby': 'حدّد بيتك القديم وشاهد ما حدث قربه', 'Tap the map where you lived': 'اضغط على الخريطة حيث كنت تسكن',
    'Near where you lived': 'قرب المكان الذي سكنت فيه', 'Move my pin': 'انقل علامتي', 'Forget it': 'احذفها', 'Share a memory of it': 'شارك ذكرى عنه',
    'Nothing on the map yet within 2 km. If you remember something from around here, you can add it.': 'لا شيء على الخريطة بعد ضمن 2 كم. إن كنت تتذكر شيئًا من هنا يمكنك إضافته.',
    'I remember something here': 'أتذكّر شيئًا هنا', 'Write it, add a photo, or record your voice': 'اكتبه، أو أضف صورة، أو سجّل صوتك',
    'Add a photo or your voice (optional)': 'أضف صورة أو صوتك (اختياري)', 'Add a photo': 'أضف صورة', 'Record your voice': 'سجّل صوتك', 'Stop recording': 'أوقف التسجيل', 'Remove': 'إزالة',
    'Voice note ready. Listen back before saving.': 'التسجيل جاهز. استمع إليه قبل الحفظ.', 'Show the photo': 'اعرض الصورة', 'Play the voice note': 'شغّل التسجيل الصوتي', 'Photos and voice notes': 'صور وتسجيلات صوتية',
    'Family testimony, not verified.': 'شهادة عائلية، غير مُتحقق منها.', 'Questions to ask your elders': 'أسئلة لكبار العائلة',
    'For younger family members: ask, listen, and if they agree, save what they say here.': 'للأجيال الأصغر: اسألوا واستمعوا، وإن وافقوا احفظوا ما يقولونه هنا.', 'Save their answer': 'احفظ إجابتهم',
    'Show me': 'أرني', 'Add a note about this': 'أضف ملاحظة عن هذا', 'Add something here': 'أضف شيئًا هنا',
    'Close': 'إغلاق', 'Cancel': 'إلغاء', 'Continue': 'متابعة', 'Hide': 'إخفاء', 'Got it': 'فهمت',
    // chat
    'Ask the atlas': 'اسأل الأطلس', 'Ask': 'اسأل', 'Ask about Tripoli…': 'اسأل عن طرابلس…', 'Suggest an addition': 'اقترح إضافة', 'Thinking…': 'أفكر…',
    'Reading the sources…': 'أقرأ المصادر…', 'Reading the archive and checking sources…': 'أقرأ الأرشيف وأتحقق من المصادر…',
    'Type the family password first. You only need to do this once.': 'اكتب كلمة سر العائلة أولًا. تحتاج إلى ذلك مرة واحدة فقط.',
    // encyclopedia
    'Places, neighbourhoods, buildings, documents and events': 'أماكن وأحياء ومبانٍ ووثائق وأحداث', 'Look up a place, person, year or topic…': 'ابحث عن مكان أو شخص أو سنة أو موضوع…',
    'All': 'الكل', 'Places': 'أماكن', 'Areas': 'مناطق', 'Documents': 'وثائق', 'Events': 'أحداث',
    'Prison': 'سجن', 'Security': 'أمن', 'Base': 'قاعدة', 'Airstrike': 'غارة', 'Fighting': 'قتال', 'Killing': 'قتل', 'Landmark': 'معلم', 'Event': 'حدث', 'Area': 'منطقة', 'Document': 'وثيقة', 'Place': 'مكان',
    // memorial
    'Those killed, executed and disappeared under Gaddafi, 1969–2011': 'من قُتلوا وأُعدموا وغُيّبوا في عهد القذافي، 1969–2011', 'We remember': 'نتذكّر',
    // settings
    'Text size': 'حجم الخط', 'Normal': 'عادي', 'Large': 'كبير', 'Larger': 'أكبر', 'Look': 'المظهر', 'Family password for AI answers': 'كلمة سر العائلة لإجابات الذكاء الاصطناعي',
    'Show the start screen again': 'أظهر شاشة البداية مجددًا', 'Show the welcome tip again': 'أظهر نصيحة الترحيب مجددًا', 'Sign out on this device': 'تسجيل الخروج على هذا الجهاز',
    'Family password': 'كلمة سر العائلة', 'Not now': 'ليس الآن', 'Enter the family password to ask questions about any place. You only do this once on each device.': 'أدخل كلمة سر العائلة لتسأل عن أي مكان. تفعل ذلك مرة واحدة على كل جهاز.',
    'Tap any marker to read about it. Press and hold anywhere on the map to ask about that spot.': 'اضغط أي رمز لتقرأ عنه. اضغط مطوّلًا على أي نقطة في الخريطة لتسأل عنها.',
    'Click any marker to read about it. Right-click anywhere on the map to ask about that spot.': 'انقر أي رمز لتقرأ عنه. انقر بالزر الأيمن على أي نقطة لتسأل عنها.',
    // timeline
    'Timeline': 'الخط الزمني',
    'Click a period to show only it · drag along the lanes to step through time · tap a dot to open a place · tap a year to look it up': 'انقر حقبة لعرضها وحدها · اسحب على المسارات للتنقل عبر الزمن · اضغط نقطة لفتح مكان · اضغط سنة لعرضها', 'Events': 'الأحداث', 'Play 1969–2011': 'تشغيل 1969–2011', 'Pause': 'إيقاف مؤقت', 'Show all lanes': 'اعرض كل المسارات', 'One lane': 'مسار واحد',
    'Ottoman': 'العثماني', 'Italian colony': 'الاستعمار الإيطالي', 'British rule': 'الحكم البريطاني', 'Kingdom of Libya': 'المملكة الليبية', 'Revolution': 'الثورة', 'Jamahiriya and terror': 'الجماهيرية والرعب',
    'US raid and Lockerbie': 'الغارة الأمريكية ولوكربي', 'UN sanctions': 'عقوبات الأمم المتحدة', 'Opening to the West': 'الانفتاح على الغرب', '2011 uprising and war': 'انتفاضة وحرب 2011', 'After Gaddafi': 'بعد القذافي',
    'Italian': 'إيطالي', 'Kingdom': 'المملكة', 'Jamahiriya': 'الجماهيرية', 'Sanctions': 'العقوبات', 'Opening': 'الانفتاح', 'After': 'بعد',
    // reports
    'Add to the map': 'أضف إلى الخريطة', 'What is it?': 'ما هو؟', 'What do you know?': 'ماذا تعرف؟', 'How do you know?': 'كيف عرفت؟', 'I saw it myself': 'رأيته بنفسي',
    'Family or friends told me': 'أخبرني أهل أو أصدقاء', 'I read or heard it (give the source below)': 'قرأته أو سمعته (اذكر المصدر أدناه)', 'Not sure': 'لست متأكدًا',
    'Name or title': 'الاسم أو العنوان', 'Your name': 'اسمك', 'Tap the map where it is': 'اضغط على مكانه في الخريطة', 'Change location': 'غيّر الموقع', 'Saved on this device only.': 'محفوظ على هذا الجهاز فقط.',
    'Added by family, not verified': 'أضافته العائلة، غير مُتحقق منه'
  };
  var RX = [
    [/^Ask me anything about Tripoli under Gaddafi[\s\S]*$/, 'اسألني أي شيء عن طرابلس في عهد القذافي وما قبله وما بعده، أو اطلب مني ما أعرضه. أبحث في أرشيف الوثائق وفي الإنترنت، وأستطيع تغيير الخريطة لك، وإن لم يكن الشيء موجودًا بعد أساعدك في طلب البحث عنه.'],
    [/^Stop (\d+) of (\d+)$/, 'المحطة $1 من $2'],
    [/^On this day, (\d+) (\w+) (\d{4})$/, 'في مثل هذا اليوم، $1 $2 $3'],
    [/^Recording… (\S+) \(up to 3 minutes\)$/, 'جارٍ التسجيل… $1 (حتى 3 دقائق)'],
    [/^(\d+) mapped places? within ([\d.]+) km · the pin stays on this device only$/, '$1 مكان على الخريطة ضمن $2 كم · العلامة تبقى على هذا الجهاز فقط'],
    [/^(\d+) places? on the map$/, '$1 على الخريطة'],
    [/^\+ (\d+) nearby$/, '+ $1 قريبة'],
    [/^Based on (\d+) sources? — see them$/, 'بناءً على $1 مصادر — اعرضها'],
    [/^Also in use: /, 'كان قيد الاستخدام أيضًا: '],
    [/^No dated events on the map for (\d+)\. The places below were in use\.$/, 'لا توجد أحداث مؤرخة على الخريطة لسنة $1. الأماكن أدناه كانت قيد الاستخدام.'],
    [/^Gaddafi years \(1969–2011\) first\. Type a name, place or year to search ([\d,]+) documents\.$/, 'سنوات القذافي (1969–2011) أولًا. اكتب اسمًا أو مكانًا أو سنة للبحث في $1 وثيقة.'],
    [/^(\d+) found for “(.*)”$/, 'وُجد $1 لـ «$2»'],
    [/^within about ([\d.]+) km$/, 'في حدود $1 كم تقريبًا'],
    [/^Completed (\d{4})$/, 'اكتمل $1'],
    [/^Throughout (\d{4})–(\d{4})$/, 'طوال $1–$2']
  ];
  var STARTERS_AR = ['أين احتُجز السجناء السياسيون؟', 'ماذا تقول الوثائق الأمريكية عن غارة 1986؟', 'اعرض لي المجازر فقط', 'ما هو باب العزيزية؟', 'خذني إلى بن عاشور على صور القمر الصناعي'];
  window.ATLAS_STARTERS_AR = STARTERS_AR;

  function addToggle() {
    var bar = document.querySelector('.bar-actions'); if (!bar || document.getElementById('btn-lang')) return;
    var b = document.createElement('button'); b.className = 'btn'; b.id = 'btn-lang'; b.type = 'button';
    b.setAttribute('data-s', LANG === 'ar' ? 'EN' : 'ع'); b.lang = LANG === 'ar' ? 'en' : 'ar';
    b.title = LANG === 'ar' ? 'English' : 'العربية';
    b.innerHTML = '<span class="lbl">' + (LANG === 'ar' ? 'English' : 'العربية') + '</span>';
    b.onclick = function () { window.ATLAS_SET_LANG(LANG === 'ar' ? 'en' : 'ar'); };
    bar.insertBefore(b, document.getElementById('btn-settings'));
    var set = document.getElementById('tip-again');
    if (set && !document.getElementById('lang-set')) {
      var s = document.createElement('button'); s.className = 'btn'; s.id = 'lang-set'; s.type = 'button';
      s.textContent = LANG === 'ar' ? 'English interface' : 'الواجهة بالعربية'; s.onclick = b.onclick; set.parentNode.insertBefore(s, set);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', addToggle); else addToggle();
  if (LANG !== 'ar') return;

  var root = document.documentElement; root.lang = 'ar'; root.dir = 'rtl'; root.classList.add('ar');
  // place names: every site, area and district name maps to its Arabic name
  function addNames() {
    (window.ATLAS_SITES || []).forEach(function (s) { if (s.ar && !AR[s.name]) AR[s.name] = s.ar; });
    (window.ATLAS_AREAS || []).forEach(function (a) { if (a.ar && !AR[a.name]) AR[a.name] = a.ar; });
    (window.ATLAS_DISTRICTS || []).forEach(function (d) { if (d[1] && !AR[d[0]]) AR[d[0]] = d[1]; });
    (window.ATLAS_STORIES || []).forEach(function (st) { if (st.ar) AR[st.title] = st.ar; });
  }
  addNames();
  var SKIP = /^(SCRIPT|STYLE|TEXTAREA|INPUT|CODE)$/;
  function tr(t) {
    var k = t.trim(); if (!k) return null;
    if (AR[k]) return t.replace(k, AR[k]);
    for (var i = 0; i < RX.length; i++) if (RX[i][0].test(k)) return t.replace(k, k.replace(RX[i][0], RX[i][1]));
    return null;
  }
  function skipEl(el) { return el.closest && el.closest('.md, .d-text, .dated, .brief, .qr p, .cn-quote, [data-noi18n]'); }
  var AUTO = '.brief, .d-text, .dated, .md, .srcs, .cn-quote, .sc-lead, .unplaced, .trow small, .yc-open';
  function walk(node) {
    if (node.nodeType === 1 && node.matches && node.matches(AUTO)) node.setAttribute('dir', 'auto');
    if (node.nodeType === 1 && node.querySelectorAll) node.querySelectorAll(AUTO).forEach(function (e) { e.setAttribute('dir', 'auto'); });
    if (node.nodeType === 3) { if (node.parentNode && !skipEl(node.parentNode)) { var v = tr(node.nodeValue); if (v != null && v !== node.nodeValue) node.nodeValue = v; } return; }
    if (node.nodeType !== 1 || SKIP.test(node.tagName)) { if (node.nodeType === 1 && node.tagName === 'INPUT') attrs(node); return; }
    attrs(node);
    for (var c = node.firstChild; c; c = c.nextSibling) walk(c);
  }
  function attrs(el) {
    ['placeholder', 'title', 'aria-label', 'data-s'].forEach(function (a) { var v = el.getAttribute && el.getAttribute(a); if (v) { var t = tr(v); if (t != null && t !== v) el.setAttribute(a, t); } });
  }
  function start() {
    addNames(); walk(document.body);
    var mapEl = document.getElementById('map'); if (mapEl) mapEl.setAttribute('dir', 'ltr');
    var tl = document.getElementById('timeline'); if (tl) tl.setAttribute('dir', 'ltr');
    new MutationObserver(function (muts) {
      muts.forEach(function (m) {
        if (m.type === 'characterData') { walk(m.target); return; }
        m.addedNodes.forEach(walk);
      });
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
    document.title = 'طرابلس: مصادر مفتوحة';
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
