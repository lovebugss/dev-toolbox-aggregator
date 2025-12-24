import React from 'react';
import {
  BsTools, BsBraces, BsFileText, BsQrCode, BsCalculator, BsMailbox, BsGrid3X3Gap, BsGripVertical, BsTextareaT, BsSquare, BsCircle, BsTriangle, BsHeart, BsTable, BsFileEarmarkMedical
} from 'react-icons/bs';
import {
  FiGlobe, FiSun, FiMoon, FiSearch, FiStar, FiChevronsLeft, FiCheckCircle, FiCode, FiInfo, FiAlertTriangle, FiX, FiAperture, FiImage, FiFilm, FiLock, FiClock, FiHash, FiDatabase, FiScissors, FiPhone, FiSmile, FiKey, FiEdit, FiLink, FiZap, FiRefreshCw, FiTarget, FiEye, FiCpu, FiCrop, FiSliders, FiType, FiDownload, FiTrash2, FiCornerUpLeft, FiCornerUpRight, FiMaximize, FiLayout, FiLayers, FiChevronUp, FiChevronDown, FiChevronsUp, FiChevronsDown, FiUnlock, FiCopy, FiBarChart2, FiArrowRight, FiPlay, FiPause, FiSkipBack, FiSkipForward, FiMenu, FiMinimize
} from 'react-icons/fi';
// Fix: Replaced BsShapes with IoShapesOutline from react-icons/io5 to fix import error.
import { IoColorPaletteOutline, IoShapesOutline } from 'react-icons/io5';
import { GoGitCompare } from 'react-icons/go';
import { VscRegex, VscFiles, VscSourceControl, VscDebugAlt, VscExtensions, VscSettingsGear, VscChevronRight, VscChevronDown, VscRemote, VscSync, VscError, VscWarning, VscSearch, VscFolder, VscFile, VscMarkdown, VscChromeMaximize, VscChromeRestore, VscScreenFull, VscScreenNormal, VscBroadcast } from 'react-icons/vsc';
// FIX: Replaced TbCompress with a suitable alternative as it is not exported.
import { TbId as TbUuid, TbHandStop, TbMessage2, TbFish, TbPlugConnected, TbDroplet } from 'react-icons/tb';
// Fix: Replaced GrCpp with SiCplusplus for C++ icon.
import { SiVuedotjs, SiCplusplus } from 'react-icons/si';
import { FaJava, FaFilePdf } from 'react-icons/fa';

type IconProps = React.SVGProps<SVGSVGElement> & { filled?: boolean; size?: string | number };

// Helper to create icon components with default classes, passing through any overrides.
const createIcon = (IconComponent: React.ElementType, defaultClassName: string = 'h-6 w-6') => {
  const Icon: React.FC<IconProps> = ({ className, ...props }) => {
    // Props like `size` from react-icons will override the default class sizing if provided.
    return <IconComponent className={`${defaultClassName} ${className || ''}`} {...props} />;
  };
  Icon.displayName = `Icon(${(IconComponent as any).displayName || (IconComponent as any).name || 'Component'})`;
  return Icon;
};

// Special case for StarIcon to handle the 'filled' prop
const Star: React.FC<IconProps> = ({ filled, className, ...props }) => {
  const finalClassName = `h-5 w-5 ${className || ''}`;
  return <FiStar className={finalClassName} fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.5} {...props} />;
};


export const ToolboxIcon = createIcon(BsTools, 'h-10 w-10 text-accent dark:text-d-accent');
export const GlobeIcon = createIcon(FiGlobe, 'h-5 w-5');
export const SunIcon = createIcon(FiSun, 'h-5 w-5');
export const MoonIcon = createIcon(FiMoon, 'h-5 w-5');
export const SearchIcon = createIcon(FiSearch, 'h-5 w-5');
export const StarIcon = Star;
export const ChevronDoubleLeftIcon = createIcon(FiChevronsLeft, 'w-6 h-6');
export const CheckCircleIcon = createIcon(FiCheckCircle, 'w-6 h-6');
export const DragHandleIcon = createIcon(BsGripVertical, 'h-5 w-5');
export const CodeIcon = createIcon(FiCode);
export const InfoIcon = createIcon(FiInfo, 'h-5 w-5');
export const AlertTriangleIcon = createIcon(FiAlertTriangle, 'h-5 w-5');
export const CloseIcon = createIcon(FiX, 'h-5 w-5');
export const BracketsIcon = createIcon(BsBraces);
export const PaletteIcon = createIcon(IoColorPaletteOutline);
export const TextIcon = createIcon(BsFileText);
export const ImageIcon = createIcon(FiImage);
export const QrCodeIcon = createIcon(BsQrCode);
export const FilmIcon = createIcon(FiFilm);
export const GitDiffIcon = createIcon(GoGitCompare);
export const LockIcon = createIcon(FiLock);
export const RegexIcon = createIcon(VscRegex);
export const ClockIcon = createIcon(FiClock);
export const HashIcon = createIcon(FiHash);
export const UuidIcon = createIcon(TbUuid);
export const DatabaseIcon = createIcon(FiDatabase);
export const TimestampIcon = createIcon(FiClock);
export const CalculatorIcon = createIcon(BsCalculator);
export const ScissorsIcon = createIcon(FiScissors);
export const PhoneIcon = createIcon(FiPhone);
export const MailboxIcon = createIcon(BsMailbox);
export const SmileyIcon = createIcon(FiSmile);
export const KeyIcon = createIcon(FiKey);
export const LedIcon = createIcon(TbMessage2);
export const EditIcon = createIcon(FiEdit);
export const LinkIcon = createIcon(FiLink);
export const TextAIcon = createIcon(BsTextareaT);
export const GridIcon = createIcon(BsGrid3X3Gap);
export const ZapIcon = createIcon(FiZap);
export const RefreshIcon = createIcon(FiRefreshCw);
export const TargetIcon = createIcon(FiTarget);
export const EyeIcon = createIcon(FiEye);
export const BrainIcon = createIcon(FiCpu);
export const CropIcon = createIcon(FiCrop);
export const SlidersIcon = createIcon(FiSliders);
export const TypeIcon = createIcon(FiType);
export const DownloadIcon = createIcon(FiDownload);
export const TrashIcon = createIcon(FiTrash2);
export const FiltersIcon = createIcon(FiAperture);
export const UndoIcon = createIcon(FiCornerUpLeft);
export const RedoIcon = createIcon(FiCornerUpRight);
export const ResizeIcon = createIcon(FiMaximize);
export const LayoutIcon = createIcon(FiLayout);
export const LayersIcon = createIcon(FiLayers);
export const UnlockIcon = createIcon(FiUnlock);
export const BringForwardIcon = createIcon(FiChevronUp);
export const SendBackwardIcon = createIcon(FiChevronDown);
export const BringToFrontIcon = createIcon(FiChevronsUp);
export const SendToBackIcon = createIcon(FiChevronsDown);
export const HandIcon = createIcon(TbHandStop);
export const CopyIcon = createIcon(FiCopy, 'h-4 w-4');
export const BarChartIcon = createIcon(FiBarChart2);
export const ArrowRightIcon = createIcon(FiArrowRight, 'h-5 w-5');
export const PlayIcon = createIcon(FiPlay, 'h-5 w-5');
export const PauseIcon = createIcon(FiPause, 'h-5 w-5');
export const SkipBackIcon = createIcon(FiSkipBack, 'h-5 w-5');
export const SkipForwardIcon = createIcon(FiSkipForward, 'h-5 w-5');
export const PlugConnectedIcon = createIcon(TbPlugConnected);
// Fix: Replaced BsShapes with IoShapesOutline.
export const ShapesIcon = createIcon(IoShapesOutline);
export const SquareIcon = createIcon(BsSquare);
export const CircleIcon = createIcon(BsCircle);
export const TriangleIcon = createIcon(BsTriangle);
export const HeartIcon = createIcon(BsHeart);
export const MenuIcon = createIcon(FiMenu, 'h-6 w-6');
export const BroadcastIcon = createIcon(VscBroadcast);
export const PdfFileIcon = createIcon(FaFilePdf);
export const WaterDropIcon = createIcon(TbDroplet);
// FIX: Replaced TbCompress with FiMinimize.
export const CompressIcon = createIcon(FiMinimize);
export const TableIcon = createIcon(BsTable);
export const DicomFileIcon = createIcon(BsFileEarmarkMedical);


// Icons for Coding Slacker
export const FishIcon = createIcon(TbFish);
export const VscFilesIcon = createIcon(VscFiles, 'h-6 w-6');
export const VscSearchIcon = createIcon(VscSearch, 'h-6 w-6');
export const VscSourceControlIcon = createIcon(VscSourceControl, 'h-6 w-6');
export const VscDebugAltIcon = createIcon(VscDebugAlt, 'h-6 w-6');
export const VscExtensionsIcon = createIcon(VscExtensions, 'h-6 w-6');
export const VscSettingsGearIcon = createIcon(VscSettingsGear, 'h-6 w-6');
export const VscChevronRightIcon = createIcon(VscChevronRight, 'h-4 w-4');
export const VscChevronDownIcon = createIcon(VscChevronDown, 'h-4 w-4');
export const VscRemoteIcon = createIcon(VscRemote, 'h-4 w-4');
export const VscSyncIcon = createIcon(VscSync, 'h-4 w-4');
export const VscErrorIcon = createIcon(VscError, 'h-4 w-4');
export const VscWarningIcon = createIcon(VscWarning, 'h-4 w-4');
export const VscFolderIcon = createIcon(VscFolder, 'h-5 w-5');
export const VscMarkdownIcon = createIcon(VscMarkdown, 'h-5 w-5');
export const VscFileIcon = createIcon(VscFile, 'h-5 w-5');
export const VscMaximizeIcon = createIcon(VscChromeMaximize, 'h-4 w-4');
export const VscRestoreIcon = createIcon(VscChromeRestore, 'h-4 w-4');
export const VscFullScreenIcon = createIcon(VscScreenFull, 'h-4 w-4');
export const VscNormalScreenIcon = createIcon(VscScreenNormal, 'h-4 w-4');
export const VueIcon = createIcon(SiVuedotjs, 'h-5 w-5');
export const JavaIcon = createIcon(FaJava, 'h-5 w-5');
// Fix: Replaced GrCpp with SiCplusplus for C++ icon.
export const CppIcon = createIcon(SiCplusplus, 'h-5 w-5');