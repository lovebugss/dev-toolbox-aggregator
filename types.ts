import React from 'react';
import {
  CodeIcon, BracketsIcon, PaletteIcon, TextIcon, ImageIcon, QrCodeIcon, FilmIcon,
  GitDiffIcon, LockIcon, RegexIcon, ClockIcon, HashIcon, UuidIcon, DatabaseIcon,
  TimestampIcon, CalculatorIcon, ScissorsIcon, PhoneIcon, MailboxIcon, GlobeIcon,
  SmileyIcon, KeyIcon, EditIcon, LinkIcon, TextAIcon, GridIcon, ZapIcon, TargetIcon, EyeIcon,
  BrainIcon, HandIcon, LedIcon, LayoutIcon, FishIcon, LayersIcon, TypeIcon, BarChartIcon, PlugConnectedIcon, ShapesIcon, VscSettingsGearIcon, BroadcastIcon, VscSourceControlIcon, PdfFileIcon, WaterDropIcon, CompressIcon, TableIcon, DicomFileIcon
} from './components/icons/Icons';

export type ToolId =
  // Web
  | 'url-parser' | 'ip-lookup' | 'phone-lookup' | 'postal-code-lookup' | 'user-agent-viewer' | 'websocket-client' | 'http-client'
  // Text
  | 'text-counter' | 'text-diff' | 'regex-editor' | 'character-frequency-counter' | 'set-calculator' | 'morse-code-translator'
  // Image & Video
  | 'image-to-base64' | 'qr-code-generator' | 'gif-splitter' | 'video-to-gif' | 'image-grid-splitter' | 'stream-broadcaster' | 'pdf-to-png' | 'long-image-stitcher' | 'dicom-viewer'
  // PDF
  | 'pdf-splitter' | 'pdf-merger' | 'pdf-watermark' | 'pdf-compressor'
  // Creative
  | 'meme-generator' | 'image-editor' | 'image-collage' | 'led-scroller' | 'coding-slacker' | 'ascii-art-generator' | 'svg-shape-generator' | 'chart-generator'
  // Math
  | 'calculator' | 'number-base-converter' | 'algorithm-visualizer'
  // Convenience
  | 'json-formatter' | 'diff-checker' | 'color-converter' | 'data-converter' | 'timestamp-converter' | 'crontab-generator' | 'json-to-java-bean' | 'commit-message-generator' | 'excel-to-json'
  // Security
  | 'base64-coder' | 'uuid-generator' | 'jwt-decoder' | 'hashing-tool' | 'md5-hasher'
  // Game
  | 'reaction-time-test' | 'selective-reaction-test' | 'color-discrimination-test' | 'memory-test' | 'inhibitory-control-test';
  
export interface Tool {
  id: ToolId;
  nameKey: string;
  descriptionKey: string;
  icon: React.ComponentType<any>;
}

export interface ToolCategory {
  nameKey: string;
  tools: Tool[];
}

export const toolCategories: ToolCategory[] = [
  {
    nameKey: 'sidebar.categories.web',
    tools: [
      { id: 'url-parser', nameKey: 'tools.urlParser.name', descriptionKey: 'tools.urlParser.description', icon: LinkIcon },
      { id: 'http-client', nameKey: 'tools.httpClient.name', descriptionKey: 'tools.httpClient.description', icon: BroadcastIcon },
      { id: 'user-agent-viewer', nameKey: 'tools.userAgentViewer.name', descriptionKey: 'tools.userAgentViewer.description', icon: GlobeIcon },
      { id: 'websocket-client', nameKey: 'tools.websocketClient.name', descriptionKey: 'tools.websocketClient.description', icon: PlugConnectedIcon },
    ],
  },
  {
    nameKey: 'sidebar.categories.text',
    tools: [
      { id: 'text-counter', nameKey: 'tools.textCounter.name', descriptionKey: 'tools.textCounter.description', icon: TextIcon },
      { id: 'diff-checker', nameKey: 'tools.diffChecker.name', descriptionKey: 'tools.diffChecker.description', icon: GitDiffIcon },
      { id: 'regex-editor', nameKey: 'tools.regexEditor.name', descriptionKey: 'tools.regexEditor.description', icon: RegexIcon },
      { id: 'character-frequency-counter', nameKey: 'tools.characterFrequencyCounter.name', descriptionKey: 'tools.characterFrequencyCounter.description', icon: TextAIcon },
      { id: 'set-calculator', nameKey: 'tools.setCalculator.name', descriptionKey: 'tools.setCalculator.description', icon: LayersIcon },
      { id: 'morse-code-translator', nameKey: 'tools.morseCodeTranslator.name', descriptionKey: 'tools.morseCodeTranslator.description', icon: ZapIcon },
    ],
  },
  {
    nameKey: 'sidebar.categories.imageVideo',
    tools: [
      { id: 'image-to-base64', nameKey: 'tools.base64ImageConverter.name', descriptionKey: 'tools.base64ImageConverter.description', icon: ImageIcon },
      { id: 'qr-code-generator', nameKey: 'tools.qrCodeGenerator.name', descriptionKey: 'tools.qrCodeGenerator.description', icon: QrCodeIcon },
      { id: 'gif-splitter', nameKey: 'tools.gifCreator.name', descriptionKey: 'tools.gifCreator.description', icon: ScissorsIcon },
      { id: 'long-image-stitcher', nameKey: 'tools.longImageStitcher.name', descriptionKey: 'tools.longImageStitcher.description', icon: LayersIcon },
      { id: 'image-grid-splitter', nameKey: 'tools.imageGridSplitter.name', descriptionKey: 'tools.imageGridSplitter.description', icon: GridIcon },
      { id: 'dicom-viewer', nameKey: 'tools.dicomViewer.name', descriptionKey: 'tools.dicomViewer.description', icon: DicomFileIcon },
      { id: 'stream-broadcaster', nameKey: 'tools.streamBroadcaster.name', descriptionKey: 'tools.streamBroadcaster.description', icon: BroadcastIcon },
    ],
  },
  {
    nameKey: 'sidebar.categories.pdf',
    tools: [
        { id: 'pdf-splitter', nameKey: 'tools.pdfSplitter.name', descriptionKey: 'tools.pdfSplitter.description', icon: ScissorsIcon },
        { id: 'pdf-merger', nameKey: 'tools.pdfMerger.name', descriptionKey: 'tools.pdfMerger.description', icon: LayersIcon },
        { id: 'pdf-watermark', nameKey: 'tools.pdfWatermark.name', descriptionKey: 'tools.pdfWatermark.description', icon: WaterDropIcon },
        { id: 'pdf-compressor', nameKey: 'tools.pdfCompressor.name', descriptionKey: 'tools.pdfCompressor.description', icon: CompressIcon },
        { id: 'pdf-to-png', nameKey: 'tools.pdfToPng.name', descriptionKey: 'tools.pdfToPng.description', icon: PdfFileIcon },

    ],
  },
  {
    nameKey: 'sidebar.categories.creative',
    tools: [
      { id: 'chart-generator', nameKey: 'tools.chartGenerator.name', descriptionKey: 'tools.chartGenerator.description', icon: BarChartIcon },
      { id: 'meme-generator', nameKey: 'tools.memeGenerator.name', descriptionKey: 'tools.memeGenerator.description', icon: SmileyIcon },
      { id: 'image-editor', nameKey: 'tools.imageEditor.name', descriptionKey: 'tools.imageEditor.description', icon: EditIcon },
      { id: 'image-collage', nameKey: 'tools.imageCollage.name', descriptionKey: 'tools.imageCollage.description', icon: LayoutIcon },
      { id: 'ascii-art-generator', nameKey: 'tools.asciiArtGenerator.name', descriptionKey: 'tools.asciiArtGenerator.description', icon: TypeIcon },
      { id: 'svg-shape-generator', nameKey: 'tools.svgShapeGenerator.name', descriptionKey: 'tools.svgShapeGenerator.description', icon: ShapesIcon },
      { id: 'led-scroller', nameKey: 'tools.ledScroller.name', descriptionKey: 'tools.ledScroller.description', icon: LedIcon },
      { id: 'coding-slacker', nameKey: 'tools.codingSlacker.name', descriptionKey: 'tools.codingSlacker.description', icon: FishIcon },
    ]
  },
   {
    nameKey: 'sidebar.categories.math',
    tools: [
      { id: 'calculator', nameKey: 'tools.calculator.name', descriptionKey: 'tools.calculator.description', icon: CalculatorIcon },
      { id: 'number-base-converter', nameKey: 'tools.numberBaseConverter.name', descriptionKey: 'tools.numberBaseConverter.description', icon: CodeIcon },
      { id: 'algorithm-visualizer', nameKey: 'tools.algorithmVisualizer.name', descriptionKey: 'tools.algorithmVisualizer.description', icon: BarChartIcon },
    ],
  },
  {
    nameKey: 'sidebar.categories.convenience',
    tools: [
      { id: 'json-formatter', nameKey: 'tools.jsonFormatter.name', descriptionKey: 'tools.jsonFormatter.description', icon: BracketsIcon },
      { id: 'json-to-java-bean', nameKey: 'tools.jsonToJavaBean.name', descriptionKey: 'tools.jsonToJavaBean.description', icon: VscSettingsGearIcon },
      { id: 'color-converter', nameKey: 'tools.colorConverter.name', descriptionKey: 'tools.colorConverter.description', icon: PaletteIcon },
      { id: 'data-converter', nameKey: 'tools.dataConverter.name', descriptionKey: 'tools.dataConverter.description', icon: DatabaseIcon },
      { id: 'excel-to-json', nameKey: 'tools.excelToJson.name', descriptionKey: 'tools.excelToJson.description', icon: TableIcon },
      { id: 'timestamp-converter', nameKey: 'tools.timestampConverter.name', descriptionKey: 'tools.timestampConverter.description', icon: TimestampIcon },
      { id: 'crontab-generator', nameKey: 'tools.crontabGenerator.name', descriptionKey: 'tools.crontabGenerator.description', icon: ClockIcon },
      { id: 'commit-message-generator', nameKey: 'tools.commitMessageGenerator.name', descriptionKey: 'tools.commitMessageGenerator.description', icon: VscSourceControlIcon },
    ],
  },
  {
    nameKey: 'sidebar.categories.security',
    tools: [
      { id: 'base64-coder', nameKey: 'tools.base64Coder.name', descriptionKey: 'tools.base64Coder.description', icon: LockIcon },
      { id: 'uuid-generator', nameKey: 'tools.uuidGenerator.name', descriptionKey: 'tools.uuidGenerator.description', icon: UuidIcon },
      { id: 'jwt-decoder', nameKey: 'tools.jwtDecoder.name', descriptionKey: 'tools.jwtDecoder.description', icon: KeyIcon },
      { id: 'hashing-tool', nameKey: 'tools.hashingTool.name', descriptionKey: 'tools.hashingTool.description', icon: HashIcon },
      { id: 'md5-hasher', nameKey: 'tools.md5Hasher.name', descriptionKey: 'tools.md5Hasher.description', icon: HashIcon },
    ],
  },
    {
    nameKey: 'sidebar.categories.games',
    tools: [
        { id: 'reaction-time-test', nameKey: 'tools.reactionTimeTest.name', descriptionKey: 'tools.reactionTimeTest.description', icon: ZapIcon },
        { id: 'selective-reaction-test', nameKey: 'tools.selectiveReactionTest.name', descriptionKey: 'tools.selectiveReactionTest.description', icon: TargetIcon },
        { id: 'color-discrimination-test', nameKey: 'tools.colorDiscriminationTest.name', descriptionKey: 'tools.colorDiscriminationTest.description', icon: EyeIcon },
        { id: 'memory-test', nameKey: 'tools.memoryTest.name', descriptionKey: 'tools.memoryTest.description', icon: BrainIcon },
        { id: 'inhibitory-control-test', nameKey: 'tools.inhibitoryControlTest.name', descriptionKey: 'tools.inhibitoryControlTest.description', icon: HandIcon },
    ],
  },
];