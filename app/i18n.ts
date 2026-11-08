import type {SystemId,View} from './anatomy.ts';

/** UI localization. The English dictionary defines the message contract; every
 *  other locale must implement the same interface (checked at compile time and
 *  by scripts/validate-interactions.mjs at runtime). Anatomical structure names
 *  come from the source datasets and stay in their source language; this layer
 *  covers the interface around them. */

export type Locale='en'|'zh';
export const LOCALES:{id:Locale;label:string}[]=[{id:'en',label:'English'},{id:'zh',label:'中文'}];
export const DEFAULT_LOCALE:Locale='en';
const SUPPORTED=new Set<string>(LOCALES.map(l=>l.id));

export interface Messages {
 docTitle:string;
 htmlLang:string;
 eyebrow:string;
 modeledPieces:(n:number)=>string;
 chooseSex:string;
 maleAnatomy:string;
 femaleAnatomy:string;
 skinCrossSection:string;
 chooseLocale:string;
 systemsPanelLabel:string;
 systemsTitle:string;
 closeSystems:string;
 presetAll:string;
 presetSkeleton:string;
 presetOrgans:string;
 showOnlySystem:(name:string)=>string;
 toggleSystem:(name:string)=>string;
 piecesVisible:(n:number)=>string;
 hideAll:string;
 findStructure:string;
 searchAnatomy:string;
 searchPanelLabel:string;
 closeSearch:string;
 searchPlaceholder:string;
 searchAria:string;
 noMatches:string;
 searchRefine:string;
 searchStart:string;
 pieceCount:(n:number)=>string;
 suggestedQueries:string[];
 cameraControls:string;
 viewName:Record<View,string>;
 viewGlyph:Record<View,string>;
 pauseRotation:string;
 rotateBody:string;
 resetView:string;
 captionSelected:string;
 captionInventory:string;
 captionSeparated:string;
 captionFemale:string;
 captionMale:string;
 captionSkin:string;
 openLayers:string;
 layersButton:string;
 explodeLabel:string;
 assembled:string;
 everyPiece:string;
 reset:string;
 assembleReset:string;
 footerOrbit:string;
 footerPan:string;
 footerZoom:string;
 footerTap:string;
 explorerPanels:string;
 sourceCredits:string;
 aboutAtlas:string;
 preparing:string;
 loadingPieces:(n:number)=>string;
 reload:string;
 catalogueError:string;
 detailFallbackSystem:string;
 atlasReference:string;
 selectedPiecesLabel:string;
 selectedPieces:(n:number)=>string;
 includedStructures:string;
 morePieces:(n:number)=>string;
 viewSource:string;
 isolate:string;
 showSurrounding:string;
 clearSelection:string;
 foldSupply:string;
 foldSupplyHint:string;
 hideStructure:string;
 hideStructureHint:string;
 heartbeatToggle:string;
 heartbeatHint:string;
 labelsToggle:string;
 labelsHint:string;
 captureImage:string;
 captureHint:string;
 systemOverviewNote:string;
 femaleReproductive:string;
 aboutEyebrow:string;
 aboutHeading:string;
 aboutIntro:string;
 aboutMaleLead:string;
 aboutMaleBody:string;
 aboutFemaleLead:string;
 aboutFemaleBody:string;
 aboutSkinLead:string;
 aboutSkinBody:string;
 aboutCoverage:string;
 aboutDesign:string;
 femaleSourceTitle:string;
 femaleCredit:string;
 femaleSourceLink:string;
 maleSourceTitle:string;
 datasetLicenseLink:string;
 geometryLink:string;
 publicationLink:string;
 canvasLabel:string;
 webglFailed:string;
 contextLost:string;
 systemNames:Record<SystemId,string>;
 systemDescriptions:Record<SystemId,string>;
 explanations:Record<string,string>;
}

const en:Messages={
 docTitle:'Human Atlas',
 htmlLang:'en',
 eyebrow:'INTERACTIVE ANATOMY',
 modeledPieces:n=>`${n.toLocaleString()} modeled pieces`,
 chooseSex:'Choose an anatomy catalogue',
 maleAnatomy:'Male anatomy',
 femaleAnatomy:'Female anatomy',
 skinCrossSection:'Skin cross-section',
 chooseLocale:'Choose interface language',
 systemsPanelLabel:'Anatomical layers',
 systemsTitle:'Systems',
 closeSystems:'Close systems',
 presetAll:'All',
 presetSkeleton:'Skeleton',
 presetOrgans:'Organs',
 showOnlySystem:name=>`Show only ${name.toLowerCase()}`,
 toggleSystem:name=>`Show ${name.toLowerCase()}`,
 piecesVisible:n=>`${n.toLocaleString()} pieces visible`,
 hideAll:'Hide all',
 findStructure:'Find a structure',
 searchAnatomy:'Search anatomy',
 searchPanelLabel:'Find anatomy',
 closeSearch:'Close search',
 searchPlaceholder:'Heart, femur, cranial nerve…',
 searchAria:'Search named anatomical structures',
 noMatches:'No structures match your search.',
 searchRefine:'Showing up to 80 matches. Refine your search to find smaller structures.',
 searchStart:'Start with a major organ, or search every named structure.',
 pieceCount:n=>`${n} ${n===1?'piece':'pieces'}`,
 suggestedQueries:['heart','brain','liver','stomach','spleen','pancreas','urinary bladder','trachea'],
 cameraControls:'Camera controls',
 viewName:{'three-quarter':'three-quarter view','front':'front view','side':'side view','back':'back view'},
 viewGlyph:{'three-quarter':'¾','front':'F','side':'S','back':'B'},
 pauseRotation:'Pause rotation',
 rotateBody:'Rotate body',
 resetView:'Reset view and layers',
 captionSelected:'SELECTED STRUCTURE',
 captionInventory:'ANATOMICAL INVENTORY',
 captionSeparated:'SEPARATED STRUCTURES',
 captionFemale:'FEMALE · REFERENCE ANATOMY',
 captionMale:'ADULT HUMAN · MALE',
 captionSkin:'SKIN · SCHEMATIC CROSS-SECTION',
 openLayers:'Open system layers',
 layersButton:'Systems',
 explodeLabel:'Explode anatomy',
 assembled:'Assembled',
 everyPiece:'Every piece',
 reset:'Reset',
 assembleReset:'Assemble and reset',
 footerOrbit:'Drag to orbit',
 footerPan:'Drag to pan',
 footerZoom:'Pinch to zoom',
 footerTap:'Tap to inspect',
 explorerPanels:'Explorer panels',
 sourceCredits:'Source & credits',
 aboutAtlas:'About this atlas',
 preparing:'Preparing the anatomy',
 loadingPieces:n=>`Loading ${n.toLocaleString()} pieces`,
 reload:'Reload viewer',
 catalogueError:'The anatomy catalogue could not be loaded.',
 detailFallbackSystem:'ANATOMY',
 atlasReference:'Atlas reference',
 selectedPiecesLabel:'Selected pieces',
 selectedPieces:n=>n.toLocaleString(),
 includedStructures:'Included structures',
 morePieces:n=>`And ${n.toLocaleString()} more modeled pieces.`,
 viewSource:'View anatomical source',
 isolate:'Isolate structure',
 showSurrounding:'Show surrounding anatomy',
 clearSelection:'Clear selection',
 foldSupply:'Fold in supply',
 foldSupplyHint:'Add the vessels and nerves that reach this structure (proximity-based)',
 hideStructure:'Hide from model',
 hideStructureHint:'Hide these pieces from the view; re-enabling their system or resetting brings them back',
 heartbeatToggle:'Heartbeat',
 heartbeatHint:'Illustrative heartbeat — not a simulation',
 labelsToggle:'Structure labels',
 labelsHint:'Atlas-plate labels with leader lines for the selected structures',
 captureImage:'Export image',
 captureHint:'Capture the 3D view as PNG',
 systemOverviewNote:'System overview · structure identified from source anatomy',
 femaleReproductive:'Female reproductive structures include the ovaries, uterine tubes, uterus, cervix, and vagina. Together they support oocyte development, fertilization, menstruation, and pregnancy.',
 aboutEyebrow:'SOURCE & SCOPE',
 aboutHeading:'A body, revealed.',
 aboutIntro:'Explore the anatomy available in two independent, licensed reference collections.',
 aboutMaleLead:'Male · BodyParts3D',
 aboutMaleBody:'2,234 individual meshes and 3,432 named concepts from an adult male reference anatomy.',
 aboutFemaleLead:'Female · Human Reference Atlas',
 aboutSkinLead:'Skin cross-section · Original schematic',
 aboutSkinBody:'A schematic section through human skin — epidermis, dermis, and hypodermis with a hair follicle, sebaceous and sweat glands, capillary loops, and nerve endings — procedurally generated as an original educational model for this viewer (no external geometry). Structures are enlarged for visibility and are not scan data.',
 aboutFemaleBody:'888 source meshes, including the whole-body surface, selected organs, and female reproductive anatomy. Eight pregnancy reference pieces are in a separate layer, hidden by default. The endocrine structures (both adrenal glands, pituitary, pineal body) and the missing skeleton (thoracic cage, skull with teeth, shoulder and limb bones, feet, intervertebral disks) are transplanted from the male BodyParts3D reference and aligned to female landmarks — vertebrae, kidneys, brain, tibiae, and the skin arm axis — so those bone positions are registered approximations, not native female geometry. Muscles are not transplanted: no female muscle source data exists, and male torso geometry would misrepresent the female figure. The pelvis is native to the female dataset, with its tissue layers grouped into hip bone concepts.',
 aboutCoverage:'These collections have different coverage. Neither contains every human structure or variation. Named concepts can contain multiple pieces; each source mesh is rendered once.',
 aboutDesign:'Colors and system groupings are designed for exploration. The geometry is simplified for the web, and short explanations provide general educational context. This is an anatomical reference, not a diagnostic or surgical tool.',
 femaleSourceTitle:'Female source',
 femaleCredit:'Kristen Browne and Heidi Schlehlein, Human Reference Atlas / HuBMAP, 3D Reference Organ Set for Female v1.5 (2023). CC BY 4.0. Geometry adapted for this viewer.',
 femaleSourceLink:'Female reference collection',
 maleSourceTitle:'Male source',
 datasetLicenseLink:'Dataset license',
 geometryLink:'Original geometry & metadata',
 publicationLink:'Read the source publication',
 canvasLabel:'Interactive human anatomy. Drag to orbit, pinch or scroll to zoom, and tap a structure to inspect it.',
 webglFailed:'This browser could not start the 3D viewer. Please try a browser with WebGL enabled.',
 contextLost:'The 3D session was paused by your device. Reload to continue.',
 systemNames:{
  skeletal:'Skeleton',muscular:'Muscles',cardiac:'Heart',sensory:'Sensory organs',arterial:'Arteries',venous:'Veins',
  nervous:'Nervous system',respiratory:'Respiratory',digestive:'Digestive',urinary:'Urinary',lymphatic:'Lymphatic',
  endocrine:'Endocrine',reproductive:'Reproductive',integumentary:'Body surface',pregnancy:'Pregnancy reference',connective:'Connective tissue',
 },
 systemDescriptions:{
  skeletal:'Bones form the supporting framework of the body, protect organs, and provide attachment points for muscles. Their internal tissue also stores minerals and produces blood cells.',
  muscular:'Skeletal muscles generate movement by pulling on their attachments. Together with tendons, they move joints, stabilize posture, and produce heat.',
  cardiac:'The heart is a muscular pump with four chambers. Its valves direct blood forward through the pulmonary and systemic circuits.',
  sensory:'These structures contribute to special senses, including sight, hearing, and balance. Their specialized tissues detect stimuli and work with the nervous system to convey information.',
  arterial:'The heart drives blood through the circulation. Arteries carry blood away from the heart to supply tissues or, in the pulmonary circuit, to the lungs.',
  venous:'Veins return blood toward the heart. Superficial and deep networks collect blood from the tissues; the pulmonary veins bring oxygenated blood back from the lungs.',
  nervous:'The brain, spinal cord, and peripheral nerves carry and process signals. They support sensation, movement, coordination, and automatic regulation of body functions.',
  respiratory:'The airways conduct air to the lungs, where oxygen and carbon dioxide move between air and blood. Breathing depends on pressure changes produced by respiratory muscles.',
  digestive:'The digestive tract breaks down food, absorbs nutrients and water, and moves waste onward. Accessory organs contribute bile and digestive enzymes.',
  urinary:'The kidneys filter blood and regulate fluid, electrolyte, and acid–base balance. Urine travels through the ureters to the bladder and exits through the urethra.',
  lymphatic:'Lymphatic vessels return excess tissue fluid to the circulation. Lymph nodes and other lymphoid organs support immune surveillance and responses.',
  endocrine:'Endocrine organs release hormones into the blood to coordinate processes such as metabolism, growth, stress responses, and reproduction.',
  reproductive:'The male reproductive structures represented here contribute to sperm production, maturation, transport, and the production of sex hormones.',
  integumentary:'The body surface provides an outer anatomical reference. The integumentary system forms a protective barrier and contributes to sensation and temperature regulation.',
  pregnancy:'The placenta and umbilical cord support exchange between maternal and fetal circulations during pregnancy. These reference structures are shown separately from the default adult anatomy.',
  connective:'Cartilage, ligaments, and other connective tissues support, connect, and separate structures. Their roles include stabilizing joints and distributing mechanical loads.',
 },
 explanations:{
  uterus:'A hollow muscular organ in the pelvis. Its lining changes through the menstrual cycle and can support implantation and development during pregnancy.',
  vagina:'A muscular canal connecting the cervix of the uterus to the outside of the body. It provides a passage for menstrual flow and forms part of the birth canal.',
  ovary:'An organ that contains developing oocytes and produces hormones including estrogen and progesterone.',
  heart:'A muscular pump in the chest. Its right side sends blood to the lungs; its left side sends blood through the systemic circulation.',
  liver:'A large organ beneath the right side of the diaphragm. It processes absorbed nutrients, produces bile, and synthesizes many proteins carried in the blood.',
  brain:'The central organ of the nervous system. Its interconnected regions support perception, movement, memory, language, and the regulation of bodily functions.',
  stomach:'A muscular chamber between the esophagus and small intestine. It stores and mixes food with acid and enzymes before releasing it into the duodenum.',
  spleen:'A lymphoid organ in the upper left abdomen. It filters blood, removes aging blood cells, and participates in immune responses.',
  pancreas:'An abdominal organ with digestive and endocrine roles. It supplies enzymes to the small intestine and releases hormones including insulin and glucagon.',
  'urinary bladder':'A muscular reservoir in the pelvis that stores urine arriving from the kidneys through the ureters.',
  trachea:'The main airway connecting the larynx to the bronchi. Its cartilage supports keep the airway open during breathing.',
  diaphragm:'A broad muscle separating the chest and abdomen. When it contracts, it increases chest volume and helps draw air into the lungs.',
 },
};

const zh:Messages={
 docTitle:'人体图谱',
 htmlLang:'zh-CN',
 eyebrow:'交互式解剖',
 modeledPieces:n=>`${n.toLocaleString()} 个建模部件`,
 chooseSex:'选择解剖图谱',
 maleAnatomy:'男性解剖',
 femaleAnatomy:'女性解剖',
 skinCrossSection:'皮肤横截面',
 chooseLocale:'选择界面语言',
 systemsPanelLabel:'解剖图层',
 systemsTitle:'系统',
 closeSystems:'关闭系统面板',
 presetAll:'全部',
 presetSkeleton:'骨骼',
 presetOrgans:'器官',
 showOnlySystem:name=>`仅显示${name}`,
 toggleSystem:name=>`显示${name}`,
 piecesVisible:n=>`${n.toLocaleString()} 个部件可见`,
 hideAll:'全部隐藏',
 findStructure:'查找结构',
 searchAnatomy:'搜索解剖结构',
 searchPanelLabel:'查找解剖结构',
 closeSearch:'关闭搜索',
 searchPlaceholder:'搜索结构名称（英文），如 heart、femur…',
 searchAria:'搜索已命名的解剖结构',
 noMatches:'没有匹配的解剖结构。',
 searchRefine:'最多显示 80 条结果。请细化关键词以找到更小的结构。',
 searchStart:'从主要器官开始，或搜索所有已命名的结构。',
 pieceCount:n=>`${n} 个部件`,
 suggestedQueries:['heart','brain','liver','stomach','spleen','pancreas','urinary bladder','trachea'],
 cameraControls:'视角控制',
 viewName:{'three-quarter':'3/4 视角','front':'正面','side':'侧面','back':'背面'},
 viewGlyph:{'three-quarter':'¾','front':'前','side':'侧','back':'后'},
 pauseRotation:'暂停旋转',
 rotateBody:'旋转人体',
 resetView:'重置视角与图层',
 captionSelected:'已选结构',
 captionInventory:'解剖全景',
 captionSeparated:'分离结构',
 captionFemale:'女性 · 参考解剖',
 captionMale:'成人 · 男性',
 captionSkin:'皮肤 · 横截面示意',
 openLayers:'打开系统图层',
 layersButton:'系统',
 explodeLabel:'分解解剖结构',
 assembled:'整体',
 everyPiece:'全部部件',
 reset:'重置',
 assembleReset:'复位并重置',
 footerOrbit:'拖动旋转',
 footerPan:'拖动平移',
 footerZoom:'双指缩放',
 footerTap:'点按查看',
 explorerPanels:'探索面板',
 sourceCredits:'来源与致谢',
 aboutAtlas:'关于本图谱',
 preparing:'正在准备解剖数据',
 loadingPieces:n=>`正在加载 ${n.toLocaleString()} 个部件`,
 reload:'重新加载',
 catalogueError:'解剖目录加载失败。',
 detailFallbackSystem:'解剖结构',
 atlasReference:'图谱编号',
 selectedPiecesLabel:'已选部件',
 selectedPieces:n=>n.toLocaleString(),
 includedStructures:'包含的结构',
 morePieces:n=>`还有 ${n.toLocaleString()} 个建模部件。`,
 viewSource:'查看解剖数据来源',
 isolate:'隔离显示',
 showSurrounding:'显示周围结构',
 clearSelection:'取消选择',
 foldSupply:'收纳供给血管',
 foldSupplyHint:'一键收入到达该结构的血管与神经（邻近判定）',
 hideStructure:'从模型中隐藏',
 hideStructureHint:'在视图中隐藏这些部件；重新开启其所在系统或重置即可恢复显示',
 heartbeatToggle:'心跳',
 heartbeatHint:'示意性心跳动画，非仿真',
 labelsToggle:'结构标注',
 labelsHint:'为选中结构显示图鉴式标注（引线）',
 captureImage:'导出图片',
 captureHint:'将当前 3D 视图导出为 PNG',
 systemOverviewNote:'系统概述 · 结构来自源解剖数据',
 femaleReproductive:'女性生殖结构包括卵巢、输卵管、子宫、子宫颈和阴道，共同支持卵细胞发育、受精、月经与妊娠。',
 aboutEyebrow:'来源与范围',
 aboutHeading:'一具身体，徐徐展开。',
 aboutIntro:'探索来自两个独立、开放授权参考数据集的解剖结构。',
 aboutMaleLead:'男性 · BodyParts3D',
 aboutMaleBody:'来自成人男性参考解剖的 2,234 个独立网格和 3,432 个已命名概念。',
 aboutFemaleLead:'女性 · Human Reference Atlas',
 aboutSkinLead:'皮肤横截面 · 原创示意',
 aboutSkinBody:'人体皮肤的示意横截面——表皮、真皮、皮下组织，含毛囊、皮脂腺、汗腺、毛细血管袢与神经末梢——为本项目程序化生成的原创教学模型（无外部几何数据）。结构尺寸为放大示意，并非扫描数据。',
 aboutFemaleBody:'888 个源网格，包括全身体表、主要器官和女性生殖结构。8 个妊娠参考部件位于单独图层，默认隐藏。内分泌结构（双侧肾上腺、垂体、松果体）与缺失的骨骼（胸廓、颅骨与牙齿、肩带与四肢骨、足骨、椎间盘）移植自男性 BodyParts3D 参考数据，按女性解剖地标（椎骨、肾脏、脑、胫骨与皮肤手臂轴线）配准对齐，因此这些骨骼位置是配准近似，并非女性原始几何。肌肉未做移植：不存在女性肌肉源数据，男性躯干肌肉会失真女性体态。骨盆为女性数据原生结构，其密质/松质骨层已归组为髋骨概念。',
 aboutCoverage:'两个数据集的覆盖范围不同，均未包含全部人体结构或变异。一个命名概念可包含多个部件；每个源网格只渲染一次。',
 aboutDesign:'配色与系统分组面向探索设计。几何数据为浏览器性能做了简化，简短说明仅提供一般性教育参考。本图谱是解剖参考工具，不能用于诊断或手术。',
 femaleSourceTitle:'女性数据来源',
 femaleCredit:'Kristen Browne 与 Heidi Schlehlein，Human Reference Atlas / HuBMAP，《3D Reference Organ Set for Female》v1.5（2023）。CC BY 4.0。几何数据为本查看器做了适配。',
 femaleSourceLink:'女性参考数据集',
 maleSourceTitle:'男性数据来源',
 datasetLicenseLink:'数据集许可',
 geometryLink:'原始几何与元数据',
 publicationLink:'阅读源论文',
 canvasLabel:'交互式人体解剖。拖动旋转，滚轮或双指缩放，点按结构查看详情。',
 webglFailed:'当前浏览器无法启动 3D 查看器，请更换支持 WebGL 的浏览器。',
 contextLost:'3D 会话被设备暂停，请重新加载以继续。',
 systemNames:{
  skeletal:'骨骼系统',muscular:'肌肉',cardiac:'心脏',sensory:'感觉器官',arterial:'动脉',venous:'静脉',
  nervous:'神经系统',respiratory:'呼吸系统',digestive:'消化系统',urinary:'泌尿系统',lymphatic:'淋巴系统',
  endocrine:'内分泌系统',reproductive:'生殖系统',integumentary:'体表',pregnancy:'妊娠参考',connective:'结缔组织',
 },
 systemDescriptions:{
  skeletal:'骨骼构成人体的支撑框架，保护器官并为肌肉提供附着点。骨内组织还储存矿物质并产生血细胞。',
  muscular:'骨骼肌通过牵拉附着点产生运动。它与肌腱共同活动关节、稳定姿态并产生热量。',
  cardiac:'心脏是具有四个腔室的肌性泵。瓣膜引导血液依次流经肺循环和体循环。',
  sensory:'这些结构参与视觉、听觉与平衡等特殊感觉。其特化组织感知刺激，并与神经系统协同传递信息。',
  arterial:'心脏驱动血液循环。动脉将血液从心脏输送到组织，或在肺循环中将血液送至肺部。',
  venous:'静脉将血液导回心脏。浅静脉与深静脉网络收集组织的血液；肺静脉则把含氧血从肺部送回。',
  nervous:'脑、脊髓与周围神经传递并处理信号，支持感觉、运动、协调以及对身体功能的自动调节。',
  respiratory:'气道将空气导入肺部，氧气与二氧化碳在此进行气体交换。呼吸依赖呼吸肌产生的压力变化。',
  digestive:'消化道分解食物、吸收营养与水分并运送残渣。附属器官提供胆汁与消化酶。',
  urinary:'肾脏过滤血液，调节体液、电解质与酸碱平衡。尿液经输尿管进入膀胱，最后经尿道排出。',
  lymphatic:'淋巴管将多余的组织液送回循环系统。淋巴结等淋巴器官支持免疫监视与免疫应答。',
  endocrine:'内分泌器官向血液释放激素，协调代谢、生长、应激反应和生殖等过程。',
  reproductive:'此处展示的男性生殖结构参与精子的产生、成熟与运输，并分泌性激素。',
  integumentary:'体表提供外部解剖参照。皮肤系统构成保护屏障，并参与感觉与体温调节。',
  pregnancy:'胎盘与脐带在妊娠期间支持母体与胎儿循环之间的物质交换。这些参考结构与默认成人解剖分开显示。',
  connective:'软骨、韧带等结缔组织起支撑、连接与分隔作用，包括稳定关节和分散机械负荷。',
 },
 explanations:{
  uterus:'盆腔内的中空肌性器官。其内膜随月经周期变化，并在妊娠期间支持着床与胚胎发育。',
  vagina:'连接子宫颈与体外的肌性管道，为经血提供通道，也是产道的一部分。',
  ovary:'含有发育中卵细胞的器官，产生包括雌激素和孕激素在内的激素。',
  heart:'胸腔内的肌性泵。右侧将血液送入肺部，左侧驱动体循环。',
  liver:'膈右下方的大器官。处理吸收的营养物质，产生胆汁，并合成多种血浆蛋白。',
  brain:'神经系统的中枢。相互连接的各脑区支持感知、运动、记忆、语言及身体功能的调节。',
  stomach:'位于食管与小肠之间的肌性腔室。储存食物并与酸和酶混合，再逐步排入十二指肠。',
  spleen:'位于左上腹的淋巴器官。过滤血液、清除衰老血细胞并参与免疫应答。',
  pancreas:'兼具消化与内分泌功能的腹部器官。向小肠分泌消化酶，并释放胰岛素和胰高血糖素等激素。',
  'urinary bladder':'盆腔内的肌性储尿器官，储存经输尿管来自肾脏的尿液。',
  trachea:'连接喉与支气管的主气道。软骨支架维持呼吸时气道畅通。',
  diaphragm:'分隔胸腔与腹腔的阔肌。收缩时扩大胸腔容积，帮助吸入空气。',
 },
};

export const DICTIONARIES:Record<Locale,Messages>={en,zh};

export function isLocale(value:string):value is Locale{return SUPPORTED.has(value);}
export function getMessages(locale:Locale):Messages{return DICTIONARIES[locale]??DICTIONARIES[DEFAULT_LOCALE];}

/** Preference order: ?lang= URL parameter, saved choice, browser languages, English. */
export function detectLocale():Locale{
 if(typeof location!=='undefined'){
  const param=new URLSearchParams(location.search).get('lang');
  if(param&&isLocale(param))return param;
 }
 if(typeof localStorage!=='undefined'){
  const saved=localStorage.getItem('atlas-locale');
  if(saved&&isLocale(saved))return saved;
 }
 if(typeof navigator!=='undefined'){
  for(const tag of navigator.languages??[]){
   const code=tag.toLowerCase().split('-')[0];
   if(isLocale(code))return code;
  }
 }
 return DEFAULT_LOCALE;
}

export function persistLocale(locale:Locale){
 if(typeof localStorage!=='undefined')try{localStorage.setItem('atlas-locale',locale);}catch{/* Private browsing; the choice lasts for this session. */}
}

/** Key parity between locales — exercised by the contract tests. */
export function localeParityIssues():string[]{
 const issues:string[]=[],walk=(a:unknown,b:unknown,path:string)=>{
  if(typeof a==='function'||typeof b==='function')return;
  if(typeof a==='object'&&a!==null&&typeof b==='object'&&b!==null){
   const ka=Object.keys(a as object).sort(),kb=Object.keys(b as object).sort();
   for(const key of ka)if(!(key in (b as object)))issues.push(`${path}.${key} missing in comparison locale`);
   for(const key of kb)if(!(key in (a as object)))issues.push(`${path}.${key} extra in comparison locale`);
   for(const key of ka)if(key in (b as object))walk((a as Record<string,unknown>)[key],(b as Record<string,unknown>)[key],`${path}.${key}`);
  }
 };
 for(const locale of LOCALES.map(l=>l.id))if(locale!==DEFAULT_LOCALE)walk(DICTIONARIES[DEFAULT_LOCALE],DICTIONARIES[locale],locale);
 return issues;
}
