import {ArticleType} from '@/types';

const styles: Record<ArticleType, string> = {
    BETA: 'bg-[#5856d6]/10 text-[#5856d6]',
    OFF: 'bg-[#ff9500]/12 text-[#c66b00]',
    TEASE: 'bg-[#af52de]/10 text-[#9438bd]',
    METEO: 'bg-[#32ade6]/12 text-[#087aa8]',
    CURS: 'bg-[#34c759]/12 text-[#248a3d]',
    LIVE: 'bg-[#ff3b30]/10 text-[#d62f28]',
    FAKE: 'bg-[#ff2d55]/10 text-[#d51f45]',
    HEADER: 'bg-[#007aff]/10 text-[#0068d9]',
};

const ArticleTypeBadge = ({type}: {type: ArticleType}) => (
    <span className={`inline-flex items-center rounded-lg px-2 py-1 text-[9px] font-extrabold leading-none tracking-[0.08em] ${styles[type]}`}>
        {type}
    </span>
);

export default ArticleTypeBadge;
