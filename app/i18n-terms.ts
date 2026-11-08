import type {Locale} from './i18n.ts';

/** Chinese display names for anatomical structures. Source datasets (BodyParts3D,
 *  Human Reference Atlas) name every concept in English; this module translates
 *  names for display with a curated phrase dictionary plus compositional rules
 *  (side, "X part of Y", vessel/nerve/bone suffixes, ordinals). Rules are
 *  all-or-nothing: any unknown token falls back to the source name, so a name is
 *  either fully translated or kept in English — never half-translated. */

const PHRASES:Record<string,string>={
 // organs and major structures
 heart:'心脏',lung:'肺',liver:'肝脏',stomach:'胃',pancreas:'胰',spleen:'脾脏',kidney:'肾',
 'urinary bladder':'膀胱',gallbladder:'胆囊',esophagus:'食管',trachea:'气管',larynx:'喉',pharynx:'咽',
 'small intestine':'小肠','large intestine':'大肠',duodenum:'十二指肠',jejunum:'空肠',ileum:'回肠',
 cecum:'盲肠',appendix:'阑尾',colon:'结肠',rectum:'直肠','anal canal':'肛管',anus:'肛门',
 brain:'脑',cerebrum:'大脑',cerebellum:'小脑',brainstem:'脑干',midbrain:'中脑',pons:'脑桥',
 'medulla oblongata':'延髓','spinal cord':'脊髓','dura mater':'硬脑膜','pia mater':'软脑膜',
 eye:'眼',eyeball:'眼球',retina:'视网膜',cornea:'角膜',lens:'晶状体',iris:'虹膜','ciliary body':'睫状体',
 'vitreous body':'玻璃体','optic chiasm':'视交叉',ear:'耳',cochlea:'耳蜗','semicircular canal':'半规管',
 vestibule:'前庭','tympanic membrane':'鼓膜',ossicle:'听小骨',
 thymus:'胸腺',skin:'皮肤',tongue:'舌',lip:'唇',nose:'鼻','nasal cavity':'鼻腔','nasal septum':'鼻中隔','pineal body':'松果体','pituitary gland':'垂体','adrenal gland':'肾上腺',
 'oral cavity':'口腔',pleura:'胸膜',peritoneum:'腹膜',pericardium:'心包',bronchus:'支气管',
 breast:'乳房','mammary gland':'乳腺',nipple:'乳头',areola:'乳晕',
 uterus:'子宫',cervix:'子宫颈',vagina:'阴道',ovary:'卵巢','uterine tube':'输卵管','fallopian tube':'输卵管',
 placenta:'胎盘','umbilical cord':'脐带',fetus:'胎儿',
 prostate:'前列腺',testis:'睾丸',epididymis:'附睾','vas deferens':'输精管','seminal vesicle':'精囊',
 penis:'阴茎',scrotum:'阴囊',urethra:'尿道',ureter:'输尿管',diaphragm:'膈',
 atrium:'心房',ventricle:'心室','interventricular septum':'室间隔','interatrial septum':'房间隔',
 'mitral valve':'二尖瓣','tricuspid valve':'三尖瓣','pulmonary valve':'肺动脉瓣',
 'sinoatrial node':'窦房结','atrioventricular node':'房室结',
 aorta:'主动脉','aortic arch':'主动脉弓','ascending aorta':'升主动脉','descending aorta':'降主动脉',
 'thoracic aorta':'胸主动脉','abdominal aorta':'腹主动脉','pulmonary trunk':'肺动脉干',
 'superior vena cava':'上腔静脉','inferior vena cava':'下腔静脉','portal vein':'门静脉',
 'great saphenous vein':'大隐静脉','small saphenous vein':'小隐静脉',
 'cisterna chyli':'乳糜池','thoracic duct':'胸导管',
 // skeleton
 skull:'颅骨',mandible:'下颌骨',maxilla:'上颌骨',vomer:'犁骨',sternum:'胸骨',manubrium:'胸骨柄',
 'xiphoid process':'剑突',rib:'肋骨',clavicle:'锁骨',scapula:'肩胛骨',humerus:'肱骨',radius:'桡骨',ulna:'尺骨',
 pelvis:'骨盆',ilium:'髂骨',ischium:'坐骨',pubis:'耻骨',femur:'股骨',patella:'髌骨',tibia:'胫骨',fibula:'腓骨',
 calcaneus:'跟骨',talus:'距骨','navicular bone':'足舟骨',cuboid:'骰骨',sacrum:'骶骨',coccyx:'尾骨',
 'vertebral column':'脊柱',vertebra:'椎骨','intervertebral disc':'椎间盘','pubic symphysis':'耻骨联合',
 phalanx:'指骨','hyoid bone':'舌骨','rib cage':'胸廓','hip bone':'髋骨',
 'compact bone':'密质','trabecular bone':'松质',
 // skull
 ethmoid:'筛骨','thyroid cartilage':'甲状软骨','cricoid cartilage':'环状软骨','major alar cartilage':'鼻翼大软骨',
 scaphoid:'手舟骨',lunate:'月骨',triquetral:'三角骨',pisiform:'豌豆骨',trapezium:'大多角骨',trapezoid:'小多角骨',
 capitate:'头状骨',hamate:'钩骨',
 'medial cuneiform bone':'内侧楔骨','intermediate cuneiform bone':'中间楔骨','lateral cuneiform bone':'外侧楔骨',
 'navicular bone of left foot':'左足舟骨','navicular bone of right foot':'右足舟骨',
 // permanent (secondary) dentition, quadrant by quadrant
 'upper central secondary incisor tooth':'上中切牙','upper lateral secondary incisor tooth':'上侧切牙',
 'upper secondary canine tooth':'上尖牙','upper first secondary premolar tooth':'上第一前磨牙',
 'upper second secondary premolar tooth':'上第二前磨牙','upper first secondary molar tooth':'上第一磨牙',
 'upper second secondary molar tooth':'上第二磨牙',
 'lower central secondary incisor tooth':'下中切牙','lower lateral secondary incisor tooth':'下侧切牙',
 'lower secondary canine tooth':'下尖牙','lower first secondary premolar tooth':'下第一前磨牙',
 'lower second secondary premolar tooth':'下第二前磨牙','lower first secondary molar tooth':'下第一磨牙',
 'lower second secondary molar tooth':'下第二磨牙',
 // intervertebral disks (BodyParts3D names use "disk")
 'intervertebral disk':'椎间盘','intervertebral disk of axis':'枢椎椎间盘',
 'intervertebral disk of third cervical vertebra':'第三颈椎椎间盘','intervertebral disk of fourth cervical vertebra':'第四颈椎椎间盘',
 'intervertebral disk of fifth cervical vertebra':'第五颈椎椎间盘','intervertebral disk of sixth cervical vertebra':'第六颈椎椎间盘',
 'intervertebral disk of seventh cervical vertebra':'第七颈椎椎间盘',
 ...Object.fromEntries(['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh']
  .map((o,i)=>[`intervertebral disk of ${o} thoracic vertebra`,`第${'一二三四五六七八九十十一'[i]}胸椎椎间盘`])),
 ...Object.fromEntries(['first','second','third','fourth','fifth']
  .map((o,i)=>[`intervertebral disk of ${o} lumbar vertebra`,`第${'一二三四五'[i]}腰椎椎间盘`])),
 // fingers and toes named as units
 'index finger':'食指','middle finger':'中指','ring finger':'环指','little finger':'小指',
 'big toe':'拇趾','little toe':'小趾','sesamoid bone':'籽骨',
 'anterior cruciate ligament':'前交叉韧带','posterior cruciate ligament':'后交叉韧带',
 knee:'膝','knee joint':'膝关节',
 // major muscles (Latin source names)
 'pectoralis major':'胸大肌','pectoralis minor':'胸小肌',deltoid:'三角肌','biceps brachii':'肱二头肌',
 'triceps brachii':'肱三头肌','biceps femoris':'股二头肌',brachialis:'肱肌',brachioradialis:'肱桡肌',
 coracobrachialis:'喙肱肌','serratus anterior':'前锯肌','rectus abdominis':'腹直肌',
 'transversus abdominis':'腹横肌','external oblique':'腹外斜肌','internal oblique':'腹内斜肌',
 'obliquus externus abdominis':'腹外斜肌','obliquus internus abdominis':'腹内斜肌',
 'rectus femoris':'股直肌','vastus lateralis':'股外侧肌','vastus medialis':'股内侧肌','vastus intermedius':'股中间肌',
 'quadriceps femoris':'股四头肌',sartorius:'缝匠肌',gracilis:'股薄肌','adductor magnus':'大收肌',
 'adductor longus':'长收肌','adductor brevis':'短收肌','gluteus maximus':'臀大肌','gluteus medius':'臀中肌',
 'gluteus minimus':'臀小肌','tensor fasciae latae':'阔筋膜张肌',piriformis:'梨状肌',
 'obturator internus':'闭孔内肌','obturator externus':'闭孔外肌',gastrocnemius:'腓肠肌',soleus:'比目鱼肌',
 'tibialis anterior':'胫骨前肌','tibialis posterior':'胫骨后肌','extensor digitorum longus':'趾长伸肌',
 'flexor digitorum longus':'趾长屈肌','flexor digitorum profundus':'指深屈肌',
 'flexor digitorum superficialis':'指浅屈肌','flexor pollicis longus':'拇长屈肌','extensor pollicis longus':'拇长伸肌',
 'extensor hallucis longus':'拇长伸肌','extensor carpi radialis longus':'桡侧腕长伸肌',
 'extensor carpi radialis brevis':'桡侧腕短伸肌','flexor carpi ulnaris':'尺侧腕屈肌','flexor carpi radialis':'桡侧腕屈肌',
 'extensor carpi ulnaris':'尺侧腕伸肌','palmaris longus':'掌长肌','pronator teres':'旋前圆肌',supinator:'旋后肌',
 'latissimus dorsi':'背阔肌',trapezius:'斜方肌','erector spinae':'竖脊肌',
 'fibularis longus':'腓骨长肌','fibularis brevis':'腓骨短肌','fibularis tertius':'第三腓骨肌',
 'iliotibial tract':'髂胫束','gingiva of upper jaw':'上颌牙龈','gingiva of lower jaw':'下颌牙龈',
 // extraocular and eyelid muscles
 'medial rectus':'内直肌','lateral rectus':'外直肌','superior rectus':'上直肌','inferior rectus':'下直肌',
 'superior oblique':'上斜肌','inferior oblique':'下斜肌','levator palpebrae superioris':'上睑提肌',
 // deep and axial back muscles
 'iliocostalis cervicis':'颈髂肋肌','iliocostalis lumborum':'腰髂肋肌','iliocostalis thoracis':'胸髂肋肌',
 'longissimus capitis':'头最长肌','longissimus cervicis':'颈最长肌','longissimus thoracis':'胸最长肌',
 'semispinalis capitis':'头半棘肌','semispinalis cervicis':'颈半棘肌','semispinalis thoracis':'胸半棘肌',
 'serratus posterior inferior':'下后锯肌','serratus posterior superior':'上后锯肌',
 spinalis:'棘肌','spinalis thoracis':'胸棘肌','splenius capitis':'头夹肌','splenius cervicis':'颈夹肌',
 'lumbar rotator':'腰旋肌','cervical rotator':'颈旋肌','thoracic rotator':'胸旋肌',
 'lateral lumbar intertransversarius':'腰横突间外侧肌','medial lumbar intertransversarius':'腰横突间内侧肌',
 'set of anterior cervical intertransversarii':'颈椎横突间前肌','set of posterior cervical intertransversarii':'颈椎横突间后肌',
 'set of interspinales lumborum':'腰棘间肌','set of interspinales cervicis':'颈棘间肌','interspinalis thoracis':'胸棘间肌',
 'innermost intercostal muscle':'肋间最内肌',
 'set of right levatores costarum breves':'右短肋提肌','set of left levatores costarum breves':'左短肋提肌',
 'set of right levatores costarum longi':'右长肋提肌','set of left levatores costarum longi':'左长肋提肌',
 'subclavius':'锁骨下肌','transversus thoracis':'胸横肌',
 // neck: supra- and infrahyoids, scalenes, deep neck
 digastric:'二腹肌',geniohyoid:'颏舌骨肌',mylohyoid:'下颌舌骨肌',stylohyoid:'茎突舌骨肌',
 sternohyoid:'胸骨舌骨肌',sternothyroid:'胸骨甲状肌',thyrohyoid:'甲状舌骨肌',omohyoid:'肩胛舌骨肌',
 'scalenus anterior':'前斜角肌','scalenus medius':'中斜角肌','scalenus posterior':'后斜角肌',
 'longus colli':'颈长肌','longus capitis':'头长肌',
 'rectus capitis anterior':'头前直肌','rectus capitis posterior major':'头后大直肌',
 'rectus capitis posterior minor':'头后小直肌','rectus capitis lateralis':'头外侧直肌',
 'obliquus capitis inferior':'头下斜肌','obliquus capitis superior':'头上斜肌',
 // tongue, palate, larynx
 genioglossus:'颏舌肌',hyoglossus:'舌骨舌肌','levator veli palatini':'腭帆提肌','tensor veli palatini':'腭帆张肌',
 'uvular muscle':'悬雍垂肌',aryepiglotticus:'杓会厌肌','crico-arytenoid':'环杓肌',cricothyroid:'环甲肌',
 'thyro-arytenoid':'甲杓肌',vocalis:'声带肌',
 // pelvic floor and hip depth
 iliacus:'髂肌',pectineus:'耻骨肌','quadratus femoris':'股方肌',coccygeus:'尾骨肌',
 iliococcygeus:'髂尾肌',pubococcygeus:'耻尾肌',puborectalis:'耻骨直肠肌','external anal sphincter':'肛门外括约肌',
 'flexor accessorius':'足底方肌','adductor minimus':'小收肌',
 // intrinsic hand muscles
 'abductor digiti minimi':'小指展肌','flexor digiti minimi brevis':'小指短屈肌','opponens digiti minimi':'小指对掌肌',
 'abductor pollicis brevis':'拇短展肌','abductor pollicis longus':'拇长展肌','flexor pollicis brevis':'拇短屈肌',
 'adductor pollicis':'拇收肌','opponens pollicis':'拇指对掌肌','extensor digiti minimi':'小指伸肌',
 'extensor digitorum':'指伸肌','extensor indicis':'示指伸肌','extensor pollicis brevis':'拇短伸肌',
 'pronator quadratus':'旋前方肌','dorsal interossei':'骨间背侧肌','palmar interossei':'骨间掌侧肌',
 lumbrical:'蚓状肌',lumbricals:'蚓状肌',
 'humeral head':'肱头','superficial head':'浅头','oblique head':'斜头','transverse head':'横头',
 'lateral head':'外侧头','medial head':'内侧头',
 'adductor hallucis':'拇收肌','flexor hallucis brevis':'拇短屈肌',
 'abductor hallucis':'拇展肌','flexor digitorum brevis':'趾短屈肌',
 'gemellus superior':'上孖肌','gemellus inferior':'下孖肌',
 'set of dorsal interossei of right hand':'右手骨间背侧肌','set of dorsal interossei of left hand':'左手骨间背侧肌',
 'set of palmar interossei of right hand':'右手骨间掌侧肌','set of palmar interossei of left hand':'左手骨间掌侧肌',
 'set of lumbricals of right hand':'右手蚓状肌','set of lumbricals of left hand':'左手蚓状肌',
 'straight part':'直部','oblique part':'斜部','superior oblique part':'上斜部','inferior oblique part':'下斜部',
 'vertical intermediate part':'垂直中间部',
 sternocleidomastoid:'胸锁乳突肌',masseter:'咬肌',temporalis:'颞肌','orbicularis oculi':'眼轮匝肌',
 'orbicularis oris':'口轮匝肌',platysma:'颈阔肌','levator scapulae':'肩胛提肌','rhomboid major':'大菱形肌',
 'rhomboid minor':'小菱形肌','teres major':'大圆肌','teres minor':'小圆肌',infraspinatus:'冈下肌',
 supraspinatus:'冈上肌',subscapularis:'肩胛下肌',anconeus:'肘肌',iliopsoas:'髂腰肌','psoas major':'腰大肌',
 semitendinosus:'半腱肌',semimembranosus:'半膜肌',popliteus:'腘肌','peroneus longus':'腓骨长肌',
 'peroneus brevis':'腓骨短肌','extensor digitorum brevis':'趾短伸肌','extensor hallucis brevis':'拇短伸肌',
 'flexor hallucis longus':'拇长屈肌','intercostal muscle':'肋间肌',
 // major vessels and nerves that need whole-phrase handling
 'internal carotid artery':'颈内动脉','external carotid artery':'颈外动脉','common carotid artery':'颈总动脉',
 'brachial plexus':'臂丛','lumbosacral plexus':'腰骶丛','cauda equina':'马尾',
 'median nerve':'正中神经','sciatic nerve':'坐骨神经','femoral nerve':'股神经','vagus nerve':'迷走神经',
 'phrenic nerve':'膈神经','optic nerve':'视神经','trigeminal nerve':'三叉神经','facial nerve':'面神经',
 'recurrent laryngeal nerve':'喉返神经',
 // skin cross-section (original schematic model)
 epidermis:'表皮',dermis:'真皮',hypodermis:'皮下组织','subcutaneous tissue':'皮下组织',
 'fat lobules':'脂肪小叶','hair shaft':'毛干','hair follicle':'毛囊','hair bulb':'毛球','hair papilla':'毛乳头',
 'dermal papilla':'真皮乳头','sebaceous gland':'皮脂腺','arrector pili muscle':'立毛肌',
 'eccrine sweat gland':'外泌汗腺','sweat duct':'汗管','sweat pore':'汗孔',
 'capillary loops':'毛细血管袢','superficial dermal plexus':'真皮浅丛','deep dermal plexus':'真皮深丛',
 'free nerve endings':'游离神经末梢','tactile corpuscle':'触觉小体',
 // surface and region terms
 body:'身体',trunk:'躯干',head:'头',neck:'颈',thorax:'胸',abdomen:'腹','pelvis area':'盆区',back:'背部',
 arm:'臂',forearm:'前臂',hand:'手',thigh:'大腿',leg:'小腿',foot:'足',toe:'趾',finger:'指',thumb:'拇指',
 face:'面部',scalp:'头皮','abdominal wall':'腹壁','thoracic wall':'胸壁',
};

const WORDS:Record<string,string>={
 // position and size
 anterior:'前',posterior:'后',superior:'上',inferior:'下',medial:'内侧',lateral:'外侧',middle:'中',
 intermediate:'中间',superficial:'浅',deep:'深',internal:'内',external:'外',common:'总',proper:'固有',
 ascending:'升',descending:'降',transverse:'横',oblique:'斜',greater:'大',lesser:'小',major:'大',minor:'小',
 long:'长',short:'短',broad:'阔',proximal:'近侧',distal:'远侧',dorsal:'背侧',ventral:'腹侧',palmar:'掌侧',
 plantar:'跖侧',digital:'指',interdigital:'指间',segmental:'段',basal:'基底',communicating:'交通',
 collateral:'侧支',recurrent:'返',great:'大',small:'小',true:'真',false:'假',floating:'浮',
 typical:'典型',atypical:'非典型',upper:'上',lower:'下',outer:'外',inner:'内',anteriorly:'前',
 // region adjectives
 cervical:'颈',thoracic:'胸',lumbar:'腰',sacral:'骶',coccygeal:'尾',sternal:'胸骨',costal:'肋',
 sternocostal:'胸肋',clavicular:'锁骨',abdominal:'腹',acromial:'肩峰',vertebral:'椎',frontal:'额',
 parietal:'顶',temporal:'颞',occipital:'枕',sphenoidal:'蝶',sphenoid:'蝶',ethmoidal:'筛',zygomatic:'颧',nasal:'鼻',
 arytenoid:'杓状',corniculate:'小角',cuneiform:'楔状',cruciate:'交叉',patellar:'髌',anterolateral:'前外侧',
 humeral:'肱',papillary:'乳头',vertical:'垂直',plantae:'足底', orbital:'眶',oral:'口',mental:'颏',maxillary:'上颌',mandibular:'下颌',coronal:'冠状',sagittal:'矢状',
 lambdoid:'人字',squamous:'鳞状',cranial:'颅',caudal:'尾侧',axial:'轴',
 pulmonary:'肺',bronchial:'支气管',tracheal:'气管',laryngeal:'喉',pharyngeal:'咽',esophageal:'食管',
 gastric:'胃',duodenal:'十二指肠',jejunal:'空肠',ileal:'回肠',colic:'结肠',colonic:'结肠',cecal:'盲肠',
 appendicular:'阑尾',rectal:'直肠',anal:'肛',hepatic:'肝',cystic:'胆囊',biliary:'胆道',pancreatic:'胰',
 splenic:'脾',mesenteric:'肠系膜',omental:'网膜',renal:'肾',ureteric:'输尿管',vesical:'膀胱',urethral:'尿道',
 adrenal:'肾上腺',thyroid:'甲状腺',parathyroid:'甲状旁腺',pituitary:'垂体',pineal:'松果体',thymic:'胸腺',
 cerebral:'大脑',cerebellar:'小脑',spinal:'脊髓',meningeal:'脑膜',cortical:'皮质',medullary:'髓质',
 optic:'视',ocular:'眼',ophthalmic:'眼',auditory:'听',acoustic:'听',vestibular:'前庭',cochlear:'耳蜗',
 olfactory:'嗅',lingual:'舌',labial:'唇',buccal:'颊',gingival:'牙龈',palatine:'腭',tonsillar:'扁桃体',
 sublingual:'舌下',submandibular:'下颌下',parotid:'腮腺',facial:'面部',auricular:'耳',carotid:'颈',
 jugular:'颈内',subclavian:'锁骨下',axillary:'腋',brachial:'肱',radial:'桡',ulnar:'尺',interosseous:'骨间',
 femoral:'股',popliteal:'腘',tibial:'胫',fibular:'腓',peroneal:'腓',pedal:'足',gluteal:'臀',
 inguinal:'腹股沟',obturator:'闭孔',iliac:'髂',umbilical:'脐',portal:'门',intercostal:'肋间',
 pericardial:'心包',myocardial:'心肌',endocardial:'心内膜',aortic:'主动脉',coronary:'冠状',cardiac:'心',
 atrial:'心房',ventricular:'心室',uterine:'子宫',ovarian:'卵巢',tubal:'输卵管',vaginal:'阴道',
 testicular:'睾丸',scrotal:'阴囊',penile:'阴茎',prostatic:'前列腺',mammary:'乳腺',lactiferous:'输乳',
 suspensory:'悬',adipose:'脂肪',interlobar:'叶间',cutaneous:'皮',muscular:'肌',mucous:'黏膜',mucosal:'黏膜',
 serous:'浆膜',fibrous:'纤维',elastic:'弹性',synovial:'滑膜',articular:'关节',periosteal:'骨膜',
 intervertebral:'椎间',metacarpal:'掌',metatarsal:'跖',carpal:'腕',tarsal:'跗',phalangeal:'指',
 plantaris:'跖',deltoid:'三角',musculophrenic:'肌膈',superficialis:'浅',profundus:'深',
 // nouns usable mid-phrase
 cavity:'腔',canal:'管',artery:'动脉',vein:'静脉',nerve:'神经',sinus:'窦',duct:'管',gland:'腺',
 lobule:'小叶',lobar:'叶',segment:'段',branch:'支',tree:'树',wall:'壁',layer:'层',capsule:'囊',
 membrane:'膜','adipose tissue':'脂肪组织',tissue:'组织',muscle:'肌',bone:'骨',cartilage:'软骨',
 ligament:'韧带',tendon:'腱',node:'结',plexus:'丛',ganglion:'神经节',root:'根',trunk:'干',division:'部',
 subdivision:'亚部',organ:'器官',surface:'面',margin:'缘',border:'缘',angle:'角',apex:'尖',base:'底',
 body:'体',head:'头',neck:'颈',tail:'尾',part:'部',lobe:'叶',process:'突',spine:'棘',crest:'嵴',
 tubercle:'结节',trochanter:'转子',condyle:'髁',epicondyle:'上髁',fossa:'窝',sulcus:'沟',groove:'沟',
 foramen:'孔',notch:'切迹',canaliculus:'小管',septum:'隔',valve:'瓣',papilla:'乳头',follicle:'卵泡',
 cortex:'皮质',medulla:'髓质',parenchyma:'实质',stroma:'基质',hilum:'门',fundus:'底',antrum:'窦',
 pylorus:'幽门',cardia:'贲门',celiac:'腹腔',tooth:'牙',teeth:'牙',
};

const SIDES:Record<string,string>={left:'左',right:'右'};
const ORDINALS:Record<string,string>={first:'第一',second:'第二',third:'第三',fourth:'第四',fifth:'第五',
 sixth:'第六',seventh:'第七',eighth:'第八',ninth:'第九',tenth:'第十',eleventh:'第十一',twelfth:'第十二'};
const SUFFIXES:Record<string,string>={artery:'动脉',vein:'静脉',nerve:'神经',muscle:'肌',bone:'骨',
 cartilage:'软骨',ligament:'韧带',gland:'腺',node:'结',branch:'支',tooth:'牙',duct:'管',lobe:'叶',
 wall:'壁',segment:'段',trunk:'干',plexus:'丛',valve:'瓣',membrane:'膜',tendon:'腱',septum:'隔',
 capsule:'囊',process:'突',fossa:'窝',crest:'嵴',sulcus:'沟',foramen:'孔',canal:'管',surface:'面',
 part:'部',cavity:'腔',commissure:'连合',column:'柱'};
const NO_REVERSE=new Set(['communicating','cruciate','oblique','papillary']);
const NUMBER_ORDINALS=['first','second','third','fourth','fifth','sixth','seventh','eighth','ninth','tenth','eleventh','twelfth'];

const cache=new Map<string,string|null>();

function assemble(head:string[],suffixZh:string,sideZh:string):string|null{
 const ordinals:string[]=[],words:string[]=[];
 for(const token of head){
  if(ORDINALS[token])ordinals.push(ORDINALS[token]);
  else if(WORDS[token])words.push(token);
  else return null;
 }
 const sequence=words.some(w=>NO_REVERSE.has(w))?words:[...words].reverse();
 const joined=sequence.map(w=>WORDS[w]).join('');
 // "adrenal gland" is 肾上腺, not 肾上腺腺: when the mapped words already end
 // with the suffix's own character, the suffix is already inside the term.
 return sideZh+ordinals.join('')+joined+(joined.endsWith(suffixZh[0])?'':suffixZh);
}

function translate(key:string):string|null{
 if(cache.has(key))return cache.get(key)!;
 const result=compute(key);
 cache.set(key,result);
 return result;
}

/** The "X" slot in "X of Y" prefers the mid-phrase word sense (体, not 身体). */
function wordish(key:string):string|null{
 if(WORDS[key])return WORDS[key];
 return translate(key);
}

function compute(key:string):string|null{
 if(!key)return null;
 // HRA numbers its structures with digits ("lumbar vertebra 5"); treat them as ordinals.
 key=key.replace(/(^|\s)(\d{1,2})(?=\s|$)/g,(m,pre:string,n:string)=>NUMBER_ORDINALS[+n-1]?pre+NUMBER_ORDINALS[+n-1]:m);
 // HRA prefixes cervical vertebrae with "mammalian"; the qualifier carries no anatomy.
 key=key.replace(/^mammalian (?=cervical)/,'');
 // drop trailing parenthetical (often Latin synonyms), translate the base, reattach
 const parenthetical=key.match(/\s*\([^)]*\)$/);
 if(parenthetical){
  const inner=compute(key.slice(0,parenthetical.index!));
  return inner?inner+parenthetical[0]:null;
 }
 if(PHRASES[key])return PHRASES[key];
 if(WORDS[key])return WORDS[key];
 const tokens=key.split(/\s+/).filter(Boolean);
 // trailing single-letter side marker used by the female dataset, e.g. "mammary gland l"
 if(tokens.length>1&&(tokens.at(-1)==='l'||tokens.at(-1)==='r')){
  const inner=translate(tokens.slice(0,-1).join(' '));
  if(inner)return SIDES[tokens.at(-1)==='l'?'left':'right']+inner;
 }
 const sideZh=tokens[0]in SIDES?SIDES[tokens[0]]:'';
 const core=(sideZh?tokens.slice(1):tokens).join(' ');
 if(core&&core!==key){const inner=translate(core);if(inner)return sideZh+inner;}
 const coreTokens=core?core.split(/\s+/).filter(Boolean):[];
 // "X part of Y" -> Y + X + 部
 const partOf=core.match(/^(.+?) part of (.+)$/);
 if(partOf){
  const parent=translate(partOf[2].trim()),region=wordish(partOf[1].trim());
  if(parent&&region)return parent+region+'部';
 }
 // "proximal/middle/distal phalanx of <digit>" -> <digit>+近节/中节/远节+指骨/趾骨
 const phalanxOf=core.match(/^(proximal|middle|distal) phalanx of (.+)$/);
 if(phalanxOf){
  const parent=translate(phalanxOf[2].trim());
  if(parent){
   const segment={proximal:'近节',middle:'中节',distal:'远节'}[phalanxOf[1] as 'proximal'|'middle'|'distal'];
   return parent+segment+(/\btoe\b/.test(phalanxOf[2])?'趾骨':'指骨');
  }
 }
 // generic "X of Y" -> Y + X
 const of=core.match(/^(.+?) of (.+)$/);
 if(of){
  const parent=translate(of[2].trim()),part=wordish(of[1].trim());
  if(parent&&part)return parent+part;
 }
 // 'suffix composition': "... <suffix word>"
 if(coreTokens.length>1){
  const suffixWord=coreTokens.at(-1)!;
  if(SUFFIXES[suffixWord]){
   const assembled=assemble(coreTokens.slice(0,-1),SUFFIXES[suffixWord],sideZh);
   if(assembled)return assembled;
  }
  // plain compound of known words, original order
  const ordinals:string[]=[],words:string[]=[];
  let ok=true;
  for(const token of coreTokens){
   if(ORDINALS[token])ordinals.push(ORDINALS[token]);
   else if(WORDS[token]||PHRASES[token])words.push(PHRASES[token]??WORDS[token]);
   else{ok=false;break;}
  }
  if(ok&&words.length)return sideZh+ordinals.join('')+words.join('');
 }
 return null;
}

/** Display 'name for a structure': fully translated, or the source name unchanged. */
export function translateStructureName(locale:Locale,name:string):string{
 const original=name.trim();
 if(locale!=='zh'||!original)return original;
 const zh=translate(original.toLowerCase());
 return zh??original;
}

/** Coverage statistics for the contract tests and debugging. */
export function translationCoverage(locale:Locale,names:string[]):{translated:number;total:number}{
 let translated=0;
 for(const name of names)if(translateStructureName(locale,name)!==name.trim())translated++;
 return {translated,total:names.length};
}
