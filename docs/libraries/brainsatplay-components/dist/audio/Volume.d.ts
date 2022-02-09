import { LitElement } from 'lit';
export declare type VolumeProps = {
    count?: number;
    volume?: number;
    backgroundColor?: string;
};
export declare class Volume extends LitElement {
    static get styles(): import("lit").CSSResult;
    static get properties(): {
        volume: {
            type: NumberConstructor;
        };
        count: {
            type: NumberConstructor;
        };
        backgroundColor: {
            type: StringConstructor;
            reflect: boolean;
        };
    };
    volume: number;
    count: number;
    backgroundColor: VolumeProps['backgroundColor'];
    constructor(props?: VolumeProps);
    willUpdate(changedProps: any): void;
    render(): import("lit-html").TemplateResult<1>;
}
