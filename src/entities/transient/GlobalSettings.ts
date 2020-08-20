export default class GlobalSettings {
    public readonly discordToken: string;

    public readonly defaultPrefix: string;

    public readonly botMasters: Array<string>;

    public readonly defaultColor: string;

    public readonly helpColor: string;

    public readonly neutralColor: string;

    public readonly negativeColor: string;

    public readonly warnColor: string;

    public readonly positiveColor: string;

    constructor(botConfig: any) {
      this.discordToken = botConfig.discordToken;
      this.defaultPrefix = botConfig.defaultPrefix || '?!';
      this.botMasters = botConfig.botMasters;
      this.defaultColor = botConfig.defaultColor || '#7ED321';
      this.helpColor = botConfig.helpColor || '#7ED321';
      this.neutralColor = botConfig.neutralColor || '#4A4A4A';
      this.negativeColor = botConfig.negativeColor || '#F12C25';
      this.warnColor = botConfig.warnColor || '#F57423';
      this.positiveColor = botConfig.positiveColor || '#7ED321';
    }
}
