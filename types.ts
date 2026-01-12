import React from 'react';
import {
  CodeIcon, BracketsIcon, PaletteIcon, TextIcon, ImageIcon, QrCodeIcon, FilmIcon,
  GitDiffIcon, LockIcon, RegexIcon, ClockIcon, HashIcon, UuidIcon, DatabaseIcon,
  TimestampIcon, CalculatorIcon, ScissorsIcon, PhoneIcon, MailboxIcon, GlobeIcon,
  SmileyIcon, KeyIcon, EditIcon, LinkIcon, TextAIcon, GridIcon, ZapIcon, RefreshIcon, TargetIcon, EyeIcon,
  BrainIcon, HandIcon, LedIcon, LayoutIcon, FishIcon, LayersIcon, TypeIcon, BarChartIcon, PlugConnectedIcon, ShapesIcon, VscSettingsGearIcon, BroadcastIcon, VscSourceControlIcon, PdfFileIcon, WaterDropIcon, CompressIcon, TableIcon, DicomFileIcon
} from './components/icons/Icons';

export type ToolId =
  // 网络
  | 'url-parser' | 'ip-lookup' | 'phone-lookup' | 'postal-code-lookup' | 'user-agent-viewer' | 'websocket-client' | 'http-client'
  // 文本
  | 'text-counter' | 'text-diff' | 'regex-editor' | 'character-frequency-counter' | 'set-calculator' | 'morse-code-translator' | 'chinese-converter'
  // 多媒体
  | 'image-to-base64' | 'qr-code-generator' | 'gif-splitter' | 'video-to-gif' | 'image-grid-splitter' | 'stream-broadcaster' | 'pdf-to-png' | 'long-image-stitcher' | 'dicom-viewer'
  // PDF
  | 'pdf-splitter' | 'pdf-merger' | 'pdf-watermark' | 'pdf-compressor'
  // 创意
  | 'meme-generator' | 'image-editor' | 'image-collage' | 'led-scroller' | 'coding-slacker' | 'ascii-art-generator' | 'svg-shape-generator' | 'chart-generator'
  // 数学
  | 'calculator' | 'number-base-converter' | 'algorithm-visualizer'
  // 工具
  | 'json-formatter' | 'diff-checker' | 'color-converter' | 'data-converter' | 'timestamp-converter' | 'time-diff-calculator' | 'timezone-converter' | 'crontab-generator' | 'json-to-java-bean' | 'commit-message-generator' | 'excel-to-json' | 'markdown-to-excel'
  // 安全
  | 'base64-coder' | 'uuid-generator' | 'jwt-decoder' | 'hashing-tool' | 'md5-hasher'
  // 效能
  | 'reaction-time-test' | 'selective-reaction-test' | 'color-discrimination-test' | 'memory-test' | 'inhibitory-control-test';
  
export interface Tool {
  id: ToolId;
  nameKey: string;
  descriptionKey: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
}

export interface ToolCategory {
  nameKey: string;
  name: string;
  tools: Tool[];
}

export const toolCategories: ToolCategory[] = [
  {
    nameKey: 'sidebar.categories.web',
    name: '网络工具',
    tools: [
      { id: 'url-parser', nameKey: 'tools.urlParser.name', descriptionKey: 'tools.urlParser.description', name: 'URL 解析', description: '解析 URL 结构及参数', icon: LinkIcon },
      { id: 'http-client', nameKey: 'tools.httpClient.name', descriptionKey: 'tools.httpClient.description', name: '接口测试', description: '调试 HTTP/REST API 请求', icon: BroadcastIcon },
      { id: 'user-agent-viewer', nameKey: 'tools.userAgentViewer.name', descriptionKey: 'tools.userAgentViewer.description', name: 'UA 查看器', description: '查看浏览器 User Agent 信息', icon: GlobeIcon },
      { id: 'websocket-client', nameKey: 'tools.websocketClient.name', descriptionKey: 'tools.websocketClient.description', name: 'WS 客户端', description: '测试 WebSocket 连接', icon: PlugConnectedIcon },
    ],
  },
  {
    nameKey: 'sidebar.categories.text',
    name: '文本处理',
    tools: [
      { id: 'text-counter', nameKey: 'tools.textCounter.name', descriptionKey: 'tools.textCounter.description', name: '文本统计', description: '统计字符数、单词数和行数', icon: TextIcon },
      // Added missing RefreshIcon import to support chinese-converter tool
      { id: 'chinese-converter', nameKey: 'tools.chineseConverter.name', descriptionKey: 'tools.chineseConverter.description', name: '简繁转换', description: '简繁体中文双向转换', icon: RefreshIcon },
      { id: 'diff-checker', nameKey: 'tools.diffChecker.name', descriptionKey: 'tools.diffChecker.pageDescription', name: '差异比对', description: '比对文本或 JSON 内容差异', icon: GitDiffIcon },
      { id: 'regex-editor', nameKey: 'tools.regexEditor.name', descriptionKey: 'tools.regexEditor.description', name: '正则测试', description: '实时测试正则表达式', icon: RegexIcon },
      { id: 'character-frequency-counter', nameKey: 'tools.characterFrequencyCounter.name', descriptionKey: 'tools.characterFrequencyCounter.description', name: '字符频率', description: '分析文本字符出现频次', icon: TextAIcon },
      { id: 'set-calculator', nameKey: 'tools.setCalculator.name', descriptionKey: 'tools.setCalculator.description', name: '集合运算', description: '计算交集、并集和差集', icon: LayersIcon },
      { id: 'morse-code-translator', nameKey: 'tools.morseCodeTranslator.name', descriptionKey: 'tools.morseCodeTranslator.description', name: '摩尔斯电码', description: '文本与摩尔斯电码互转', icon: ZapIcon },
    ],
  },
  {
    nameKey: 'sidebar.categories.imageVideo',
    name: '多媒体',
    tools: [
      { id: 'image-to-base64', nameKey: 'tools.base64ImageConverter.name', descriptionKey: 'tools.base64ImageConverter.description', name: '图片转 Base64', description: '图片与数据字符串互转', icon: ImageIcon },
      { id: 'qr-code-generator', nameKey: 'tools.qrCodeGenerator.name', descriptionKey: 'tools.qrCodeGenerator.description', name: '二维码生成', description: '生成自定义样式的二维码', icon: QrCodeIcon },
      { id: 'gif-splitter', nameKey: 'tools.gifCreator.name', descriptionKey: 'tools.gifCreator.description', name: 'GIF 分解', description: '从 GIF 提取帧或合成动画', icon: ScissorsIcon },
      { id: 'long-image-stitcher', nameKey: 'tools.longImageStitcher.name', descriptionKey: 'tools.longImageStitcher.description', name: '长图拼接', description: '合并多张图片为长图', icon: LayersIcon },
      { id: 'image-grid-splitter', nameKey: 'tools.imageGridSplitter.name', descriptionKey: 'tools.imageGridSplitter.description', name: '图片切割', description: '将图片切分为网格瓦片', icon: GridIcon },
      { id: 'dicom-viewer', nameKey: 'tools.dicomViewer.name', descriptionKey: 'tools.dicomViewer.description', name: 'DICOM 查看', description: '查看医学影像 DCM 文件', icon: DicomFileIcon },
      { id: 'stream-broadcaster', nameKey: 'tools.streamBroadcaster.name', descriptionKey: 'tools.streamBroadcaster.description', name: '推流助手', description: 'WebRTC 实时推流工具', icon: BroadcastIcon },
    ],
  },
  {
    nameKey: 'sidebar.categories.pdf',
    name: 'PDF 处理',
    tools: [
        { id: 'pdf-splitter', nameKey: 'tools.pdfSplitter.name', descriptionKey: 'tools.pdfSplitter.description', name: 'PDF 拆分', description: '将 PDF 按页拆分为多个文件', icon: ScissorsIcon },
        { id: 'pdf-merger', nameKey: 'tools.pdfMerger.name', descriptionKey: 'tools.pdfMerger.description', name: 'PDF 合并', description: '合并多个 PDF 为单一文件', icon: LayersIcon },
        { id: 'pdf-watermark', nameKey: 'tools.pdfWatermark.name', descriptionKey: 'tools.pdfWatermark.description', name: 'PDF 水印', description: '为 PDF 添加文本或图片水印', icon: WaterDropIcon },
        { id: 'pdf-compressor', nameKey: 'tools.pdfCompressor.name', descriptionKey: 'tools.pdfCompressor.description', name: 'PDF 压缩', description: '减小 PDF 文件存储体积', icon: CompressIcon },
        { id: 'pdf-to-png', nameKey: 'tools.pdfToPng.name', descriptionKey: 'tools.pdfToPng.description', name: 'PDF 转图片', description: '将 PDF 页面导出为 PNG', icon: PdfFileIcon },
    ],
  },
  {
    nameKey: 'sidebar.categories.creative',
    name: '图形创意',
    tools: [
      { id: 'chart-generator', nameKey: 'tools.chartGenerator.name', descriptionKey: 'tools.chartGenerator.description', name: '数据可视化', description: '快速生成图表和可视化', icon: BarChartIcon },
      { id: 'meme-generator', nameKey: 'tools.memeGenerator.name', descriptionKey: 'tools.memeGenerator.description', name: '表情包制作', description: '快速制作个性化表情包', icon: SmileyIcon },
      { id: 'image-editor', nameKey: 'tools.imageEditor.name', descriptionKey: 'tools.imageEditor.description', name: '图片编辑', description: '基础调色、裁剪和滤镜', icon: EditIcon },
      { id: 'image-collage', nameKey: 'tools.imageCollage.name', descriptionKey: 'tools.imageCollage.description', name: '拼图制作', description: '网格布局照片拼贴', icon: LayoutIcon },
      { id: 'ascii-art-generator', nameKey: 'tools.asciiArtGenerator.name', descriptionKey: 'tools.asciiArtGenerator.description', name: '字符画生成', description: '将图片转换为字符画', icon: TypeIcon },
      { id: 'svg-shape-generator', nameKey: 'tools.svgShapeGenerator.name', descriptionKey: 'tools.svgShapeGenerator.description', name: 'SVG 合成', description: '生成抽象几何矢量图形', icon: ShapesIcon },
      { id: 'led-scroller', nameKey: 'tools.ledScroller.name', descriptionKey: 'tools.ledScroller.description', name: 'LED 滚屏', description: '模拟手持 LED 电子招牌', icon: LedIcon },
      { id: 'coding-slacker', nameKey: 'tools.codingSlacker.name', descriptionKey: 'tools.codingSlacker.description', name: '伪装编辑器', description: '模拟开发环境进行码字', icon: FishIcon },
    ]
  },
   {
    nameKey: 'sidebar.categories.math',
    name: '数学逻辑',
    tools: [
      { id: 'calculator', nameKey: 'tools.calculator.name', descriptionKey: 'tools.calculator.description', name: '计算器', description: '标准 arith 算术运算工具', icon: CalculatorIcon },
      { id: 'number-base-converter', nameKey: 'tools.numberBaseConverter.name', descriptionKey: 'tools.numberBaseConverter.description', name: '进制转换', description: '支持 2, 8, 10, 16 进制互转', icon: CodeIcon },
      { id: 'algorithm-visualizer', nameKey: 'tools.algorithmVisualizer.name', descriptionKey: 'tools.algorithmVisualizer.description', name: '算法仿真', description: '可视化展示排序算法过程', icon: BarChartIcon },
    ],
  },
  {
    nameKey: 'sidebar.categories.convenience',
    name: '通用工具',
    tools: [
      { id: 'json-formatter', nameKey: 'tools.jsonFormatter.name', descriptionKey: 'tools.jsonFormatter.description', name: 'JSON 美化', description: '格式化及校验 JSON 结构', icon: BracketsIcon },
      { id: 'json-to-java-bean', nameKey: 'tools.jsonToJavaBean.name', descriptionKey: 'tools.jsonToJavaBean.description', name: 'JSON 转 Java', description: '生成 POJO 或 DDL 转换', icon: VscSettingsGearIcon },
      { id: 'color-converter', nameKey: 'tools.colorConverter.name', descriptionKey: 'tools.colorConverter.description', name: '颜色转换', description: '颜色空间及 HEX 互转', icon: PaletteIcon },
      { id: 'data-converter', nameKey: 'tools.dataConverter.name', descriptionKey: 'tools.dataConverter.description', name: '格式转换', description: 'JSON, YAML, XML 互转', icon: DatabaseIcon },
      { id: 'excel-to-json', nameKey: 'tools.excelToJson.name', descriptionKey: 'tools.excelToJson.description', name: 'Excel 转 JSON', description: '提取表格数据为 JSON', icon: TableIcon },
      { id: 'markdown-to-excel', nameKey: 'tools.markdownToExcel.name', descriptionKey: 'tools.markdownToExcel.description', name: 'Markdown 转 Excel', description: '将 MD 表格转换为 Excel', icon: TableIcon },
      { id: 'timestamp-converter', nameKey: 'tools.timestampConverter.name', descriptionKey: 'tools.timestampConverter.description', name: '时间戳', description: 'Unix 时间与日期互转', icon: TimestampIcon },
      { id: 'time-diff-calculator', nameKey: 'tools.timeDiffCalculator.name', descriptionKey: 'tools.timeDiffCalculator.description', name: '时间间隔', description: '计算两个时间点差值', icon: ClockIcon },
      { id: 'timezone-converter', nameKey: 'tools.timezoneConverter.name', descriptionKey: 'tools.timezoneConverter.description', name: '时区转换', description: '全球时区时间同步查询', icon: GlobeIcon },
      { id: 'crontab-generator', nameKey: 'tools.crontabGenerator.name', descriptionKey: 'tools.crontabGenerator.description', name: 'Cron 计划', description: '生成 Crontab 调度表达式', icon: ClockIcon },
      { id: 'commit-message-generator', nameKey: 'tools.commitMessageGenerator.name', descriptionKey: 'tools.commitMessageGenerator.description', name: 'Commit 助手', description: '格式化规范提交信息', icon: VscSourceControlIcon },
    ],
  },
  {
    nameKey: 'sidebar.categories.security',
    name: '安全加密',
    tools: [
      { id: 'base64-coder', nameKey: 'tools.base64Coder.name', descriptionKey: 'tools.base64Coder.description', name: 'Base64 文本', description: '文本 Base64 编解码', icon: LockIcon },
      { id: 'uuid-generator', nameKey: 'tools.uuidGenerator.name', descriptionKey: 'tools.uuidGenerator.description', name: 'ID 生成器', description: '生成 UUID v4 唯一标识', icon: UuidIcon },
      { id: 'jwt-decoder', nameKey: 'tools.jwtDecoder.name', descriptionKey: 'tools.jwtDecoder.description', name: 'JWT 解码', description: '解析 JWT 头部及载荷内容', icon: KeyIcon },
      { id: 'hashing-tool', nameKey: 'tools.hashingTool.name', descriptionKey: 'tools.hashingTool.description', name: '哈希指纹', description: '计算 SHA 摘要信息', icon: HashIcon },
      { id: 'md5-hasher', nameKey: 'tools.md5Hasher.name', descriptionKey: 'tools.md5Hasher.description', name: 'MD5 校验', description: '计算 128位 MD5 校验和符', icon: HashIcon },
    ],
  },
    {
    nameKey: 'sidebar.categories.games',
    name: '性能测试',
    tools: [
        { id: 'reaction-time-test', nameKey: 'tools.reactionTimeTest.name', descriptionKey: 'tools.reactionTimeTest.description', name: '反应速度', description: '测量人机交互反应延迟', icon: ZapIcon },
        { id: 'selective-reaction-test', nameKey: 'tools.selectiveReactionTest.name', descriptionKey: 'tools.selectiveReactionTest.description', name: '专注力测试', description: '测量认知选择性注意力', icon: TargetIcon },
        { id: 'color-discrimination-test', nameKey: 'tools.colorDiscriminationTest.name', descriptionKey: 'tools.colorDiscriminationTest.description', name: '辨色力', description: '测量细微颜色差异识别', icon: EyeIcon },
        { id: 'memory-test', nameKey: 'tools.memoryTest.name', descriptionKey: 'tools.memoryTest.description', name: '记忆力', description: '评估短时空间记忆容量', icon: BrainIcon },
        { id: 'inhibitory-control-test', nameKey: 'tools.inhibitoryControlTest.name', descriptionKey: 'tools.inhibitoryControlTest.description', name: '抑制控制', description: '测量反应抑制和冲动控制', icon: HandIcon },
    ],
  },
];