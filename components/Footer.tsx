import React from 'react';

const Footer: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="w-full bg-secondary dark:bg-d-secondary border-t border-border-color dark:border-d-border-color text-center p-6 mt-auto">
            <p className="text-sm text-text-secondary dark:text-d-text-secondary">
                © {currentYear} DevToolbox. All Rights Reserved.
            </p>
            {/* <a href="https://beian.miit.gov.cn/#/Integrated/index" className="text-xs text-text-secondary dark:text-d-text-secondary mt-2">
                备案号: 京ICP备19036000号-1
            </a> */}
        </footer>
    );
};

export default Footer;
