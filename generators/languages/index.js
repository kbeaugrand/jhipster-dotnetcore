/* eslint-disable consistent-return */
const _ = require('lodash');
const chalk = require('chalk');
const LanguageGenerator = require('generator-jhipster/generators/languages');
const jhipsterUtils = require('generator-jhipster/generators/utils');

// eslint-disable-next-line import/no-extraneous-dependencies
const toPascalCase = require('to-pascal-case');
const constants = require('../generator-dotnetcore-constants');

module.exports = class extends LanguageGenerator {
    constructor(args, opts) {
        super(args, Object.assign({ fromBlueprint: true }, opts)); // fromBlueprint variable is important

        const jhContext = (this.jhipsterContext = this.options.jhipsterContext);

        if (!jhContext) {
            this.error(`This is a JHipster blueprint and should be used only like ${chalk.yellow('jhipster --blueprint dotnetcore')}`);
        }

        this.configOptions = jhContext.configOptions || {};
    }

    get initializing() {
        return super._initializing();
    }

    get prompting() {
        return super._prompting();
    }

    get configuring() {
        const phaseFromJHipster = super._configuring();

        const customPhaseSteps = {
            configureGlobalDotnetcore() {
                this.camelizedBaseName = _.camelCase(this.baseName);
                this.dasherizedBaseName = _.kebabCase(this.baseName);
                this.pascalizedBaseName = toPascalCase(this.baseName);
                this.lowercaseBaseName = this.baseName.toLowerCase();
                this.humanizedBaseName = _.startCase(this.baseName);
                this.solutionName = this.pascalizedBaseName;
                this.mainProjectDir = this.pascalizedBaseName;
                this.mainClientDir = `${this.mainProjectDir}/ClientApp`;
                this.mainAngularDir = `${this.mainProjectDir}/ClientApp/app`;
                this.testProjectDir = `${this.pascalizedBaseName}${constants.PROJECT_TEST_SUFFIX}`;
                this.relativeMainClientDir = 'ClientApp';
                this.relativeMainAngularDir = `${this.relativeMainClientDir}/app`;
            },
            saveConfigDotnetcore() {
                return {
                    saveConfig() {
                        const config = {};
                        this.config.set(config);
                    }
                };
            }
        };
        return { ...phaseFromJHipster, ...customPhaseSteps };
    }

    get default() {
        return super._default();
    }

    get writing() {
        return {
            translateFile() {
                const from = 'src/main/webapp/';
                const to = `${constants.SERVER_SRC_DIR}/${this.mainClientDir}/`;
                this.languagesToApply.forEach(language => {
                    if (!this.skipClient) {
                        this._installI18nClientFilesByLanguageDotNetCore(from, to, language);
                    }
                    // if (!this.skipServer) {
                    //     this.installI18nServerFilesByLanguage(this, constants.SERVER_MAIN_RES_DIR, language, constants.SERVER_TEST_RES_DIR);
                    // }
                    // statistics.sendSubGenEvent('languages/language', language);
                    this.replaceContent(
                        `${constants.SERVER_SRC_DIR}/${this.mainClientDir}/i18n/${language}/home.json`,
                        'Java',
                        '.Net Core',
                        false
                    );
                });
            },
            write() {
                const from = 'src/main/webapp/';
                const to = `${constants.SERVER_SRC_DIR}/${this.mainClientDir}/`;
                if (!this.skipClient) {
                    this.languages.forEach(
                        language => {
                            this._installI18nClientFilesByLanguageDotNetCore(from, to, language);
                            this._updateLanguagesInLanguageConstantNG2DotNetCore(this.languages);
                            this._updateLanguagesInWebpackDotNetCore(this.languages);
                            if (this.clientFramework === 'angularX') {
                                this._updateLanguagesInMomentWebpackNgxDotNetCore(this.languages);
                            }
                            // if (this.clientFramework === 'react') {
                            //     this.updateLanguagesInMomentWebpackReact(this.languages);
                            // }
                            this.replaceContent(
                                `${constants.SERVER_SRC_DIR}/${this.mainClientDir}/i18n/${language}/home.json`,
                                'Java',
                                '.Net Core',
                                false
                            );
                        }
                        // if (!this.skipServer) {
                        //     this.updateLanguagesInLanguageMailServiceIT(this.languages, this.packageFolder);
                        // }
                    );
                }
            }
        };
    }

    _installI18nClientFilesByLanguageDotNetCore(from, to, lang) {
        const prefix = this.fetchFromInstalledJHipster('languages/templates');
        if (this.databaseType !== 'no' && this.databaseType !== 'cassandra') {
            this._copyI18nFilesByNameDotNetCore(from, to, 'audits.json', lang);
        }
        if (this.applicationType === 'gateway' && this.serviceDiscoveryType) {
            this._copyI18nFilesByNameDotNetCore(from, to, 'gateway.json', lang);
        }
        this._copyI18nFilesByNameDotNetCore(from, to, 'configuration.json', lang);
        this._copyI18nFilesByNameDotNetCore(from, to, 'error.json', lang);
        this._copyI18nFilesByNameDotNetCore(from, to, 'login.json', lang);
        this._copyI18nFilesByNameDotNetCore(from, to, 'home.json', lang);
        this._copyI18nFilesByNameDotNetCore(from, to, 'metrics.json', lang);
        this._copyI18nFilesByNameDotNetCore(from, to, 'logs.json', lang);
        this._copyI18nFilesByNameDotNetCore(from, to, 'password.json', lang);
        this._copyI18nFilesByNameDotNetCore(from, to, 'register.json', lang);
        this._copyI18nFilesByNameDotNetCore(from, to, 'sessions.json', lang);
        this._copyI18nFilesByNameDotNetCore(from, to, 'settings.json', lang);
        this._copyI18nFilesByNameDotNetCore(from, to, 'user-management.json', lang);

        // tracker.json for Websocket
        if (this.websocket === 'spring-websocket') {
            this._copyI18nFilesByNameDotNetCore(from, to, 'tracker.json', lang);
        }

        // Templates
        this.template(`${prefix}/${from}i18n/${lang}/activate.json.ejs`, `${to}i18n/${lang}/activate.json`);
        this.template(`${prefix}/${from}i18n/${lang}/global.json.ejs`, `${to}i18n/${lang}/global.json`);
        this.template(`${prefix}/${from}i18n/${lang}/health.json.ejs`, `${to}i18n/${lang}/health.json`);
        this.template(`${prefix}/${from}i18n/${lang}/reset.json.ejs`, `${to}i18n/${lang}/reset.json`);
    }

    _copyI18nFilesByNameDotNetCore(from, to, fileToCopy, lang) {
        const prefix = this.fetchFromInstalledJHipster('languages/templates');
        this.copy(`${prefix}/${from}i18n/${lang}/${fileToCopy}`, `${to}i18n/${lang}/${fileToCopy}`);
    }

    _updateLanguagesInLanguageConstantNG2DotNetCore(languages) {
        if (this.clientFramework !== 'angularX') {
            return;
        }
        const fullPath = `${this.mainClientDir}app/core/language/language.constants.ts`;
        try {
            let content = 'export const LANGUAGES: string[] = [\n';
            languages.forEach((language, i) => {
                content += `    '${language}'${i !== languages.length - 1 ? ',' : ''}\n`;
            });
            content += '    // jhipster-needle-i18n-language-constant - JHipster will add/remove languages in this array\n];';

            jhipsterUtils.replaceContent(
                {
                    file: fullPath,
                    pattern: /export.*LANGUAGES.*\[([^\]]*jhipster-needle-i18n-language-constant[^\]]*)\];/g,
                    content
                },
                this
            );
        } catch (e) {
            this.log(
                chalk.yellow('\nUnable to find ') +
                    fullPath +
                    chalk.yellow(' or missing required jhipster-needle. LANGUAGE constant not updated with languages: ') +
                    languages +
                    chalk.yellow(' since block was not found. Check if you have enabled translation support.\n')
            );
            this.debug('Error:', e);
        }
    }

    _updateLanguagesInWebpackDotNetCore(languages) {
        const fullPath = `${constants.SERVER_SRC_DIR}/${this.mainProjectDir}/webpack/webpack.common.js`;
        try {
            let content = 'groupBy: [\n';
            languages.forEach((language, i) => {
                content += `                    { pattern: "./${
                    this.relativeMainClientDir
                }/i18n/${language}/*.json", fileName: "./i18n/${language}.json" }${i !== languages.length - 1 ? ',' : ''}\n`;
            });
            content +=
                '                    // jhipster-needle-i18n-language-webpack - JHipster will add/remove languages in this array\n' +
                '                ]';

            jhipsterUtils.replaceContent(
                {
                    file: fullPath,
                    pattern: /groupBy:.*\[([^\]]*jhipster-needle-i18n-language-webpack[^\]]*)\]/g,
                    content
                },
                this
            );
        } catch (e) {
            this.log(
                chalk.yellow('\nUnable to find ') +
                    fullPath +
                    chalk.yellow(' or missing required jhipster-needle. Webpack language task not updated with languages: ') +
                    languages +
                    chalk.yellow(' since block was not found. Check if you have enabled translation support.\n')
            );
            this.debug('Error:', e);
        }
    }

    _updateLanguagesInMomentWebpackNgxDotNetCore(languages) {
        const fullPath = `${constants.SERVER_SRC_DIR}/${this.mainProjectDir}/webpack/webpack.common.js`;
        try {
            let content = 'localesToKeep: [\n';
            languages.forEach((language, i) => {
                content += `                    '${this.getMomentLocaleId(language)}'${i !== languages.length - 1 ? ',' : ''}\n`;
            });
            content +=
                '                    // jhipster-needle-i18n-language-moment-webpack - JHipster will add/remove languages in this array\n' +
                '                ]';

            jhipsterUtils.replaceContent(
                {
                    file: fullPath,
                    pattern: /localesToKeep:.*\[([^\]]*jhipster-needle-i18n-language-moment-webpack[^\]]*)\]/g,
                    content
                },
                this
            );
        } catch (e) {
            this.log(
                chalk.yellow('\nUnable to find ') +
                    fullPath +
                    chalk.yellow(' or missing required jhipster-needle. Webpack language task not updated with languages: ') +
                    languages +
                    chalk.yellow(' since block was not found. Check if you have enabled translation support.\n')
            );
            this.debug('Error:', e);
        }
    }
};
