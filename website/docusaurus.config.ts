import { themes as prismThemes } from 'prism-react-renderer';
import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';

const config: Config = {
    title: 'VS Code Spell Checker',
    tagline: 'A spell checker for VS Code!',
    favicon: 'img/favicon.ico',

    // Set the production url of your site here
    url: 'https://streetsidesoftware.com',
    // Set the /<baseUrl>/ pathname under which your site is served
    // For GitHub pages deployment, it is often '/<projectName>/'
    baseUrl: '/vscode-spell-checker/',

    // GitHub pages deployment config.
    // If you aren't using GitHub pages, you don't need these.
    organizationName: 'streetsidesoftware', // Usually your GitHub org/user name.
    projectName: 'vscode-spell-checker', // Usually your repo name.

    trailingSlash: false,

    onBrokenLinks: 'throw',
    onBrokenMarkdownLinks: 'warn',

    // Even if you don't use internationalization, you can use this field to set
    // useful metadata like html lang. For example, if your site is Chinese, you
    // may want to replace "en" with "zh-Hans".
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
    },

    markdown: {
        // format: 'detect',
    },

    presets: [
        [
            'classic',
            {
                docs: {
                    sidebarPath: './sidebars.ts',
                    // Please change this to your repo.
                    // Remove this to remove the "edit this page" links.
                    editUrl: 'https://github.com/streetsidesoftware/vscode-spell-checker/tree/main/website/docs',
                },
                // blog: {
                //   showReadingTime: true,
                //   // Please change this to your repo.
                //   // Remove this to remove the "edit this page" links.
                //   editUrl:
                //     'https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/',
                // },
                theme: {
                    customCss: './src/css/custom.css',
                },
            } satisfies Preset.Options,
        ],
    ],

    themeConfig: {
        // Replace with your project's social card
        //image: 'img/docusaurus-social-card.jpg',
        colorMode: {
            defaultMode: 'light',
            disableSwitch: false,
            respectPrefersColorScheme: false,
        },
        navbar: {
            title: 'VS Code Spell Checker',
            logo: {
                alt: 'Street Side Software Logo',
                src: 'img/logo.png',
                target: '/',
            },
            items: [
                { label: 'Home', href: 'https://streetsidesoftware.com', position: 'left' },
                {
                    type: 'docSidebar',
                    sidebarId: 'docs',
                    position: 'left',
                    label: 'Docs',
                },
                { to: '/about', label: 'About', position: 'left' },
                { label: 'Sponsor', href: 'https://streetsidesoftware.com/sponsor', position: 'right' },
                // { label: 'CSpell', href: 'https://cspell.org', position: 'right' },
                // {to: '/blog', label: 'Blog', position: 'left'},
                {
                    href: 'https://github.com/streetsidesoftware/vscode-spell-checker',
                    label: 'GitHub',
                    position: 'right',
                },
            ],
        },
        footer: {
            style: 'dark',
            links: [
                {
                    title: 'Street Side Software',
                    items: [
                        { label: 'Home', href: 'https://streetsidesoftware.com' },
                        { label: 'CSpell', href: 'https://cspell.org' },
                        { label: 'Sponsor', href: 'https://streetsidesoftware.com/sponsor/' },
                    ],
                },
                {
                    title: 'GitHub',
                    items: [
                        { label: 'GitHub', href: 'https://github.com/streetsidesoftware/vscode-spell-checker' },
                        { label: 'Issues', href: 'https://github.com/streetsidesoftware/vscode-spell-checker/issues' },
                        { label: 'Discussions', href: 'https://github.com/streetsidesoftware/vscode-spell-checker/discussions' },
                        { label: 'Sponsor through GitHub', href: 'https://github.com/sponsors/streetsidesoftware' },
                    ],
                },
                {
                    title: 'VS Code Marketplace',
                    items: [
                        {
                            label: 'VS Code Spell Checker Extension',
                            href: 'https://marketplace.visualstudio.com/items?itemName=streetsidesoftware.code-spell-checker',
                        },
                        { label: 'Other Extensions', href: 'https://marketplace.visualstudio.com/publishers/streetsidesoftware' },
                    ],
                },
            ],
            copyright: `Copyright © 2016 - ${new Date().getFullYear()} Street Side Software <img width="16" alt="Street Side Software Logo" src="https://i.imgur.com/CyduuVY.png" />`,
        },
        prism: {
            theme: prismThemes.github,
            darkTheme: prismThemes.dracula,
            additionalLanguages: ['json', 'json5', 'bash'],
        },
    } satisfies Preset.ThemeConfig,

    scripts: [
        {
            defer: true,
            'data-domain': 'streetsidesoftware.com',
            src: 'https://plausible.io/js/script.js',
        },
    ],
};

export default config;
