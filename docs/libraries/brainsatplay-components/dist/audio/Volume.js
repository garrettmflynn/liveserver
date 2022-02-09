import { LitElement, html, css, } from 'lit';
export class Volume extends LitElement {
    constructor(props = {}) {
        var _a, _b, _c;
        super();
        this.volume = (_a = props.volume) !== null && _a !== void 0 ? _a : 0;
        this.backgroundColor = (_b = props.backgroundColor) !== null && _b !== void 0 ? _b : '#69ce2b';
        this.count = (_c = props.count) !== null && _c !== void 0 ? _c : 10;
    }
    static get styles() {
        return css `

      #wrapper{
        width: 100%;
      }

      `;
    }
    static get properties() {
        return {
            volume: {
                type: Number,
            },
            count: {
                type: Number,
            },
            backgroundColor: {
                type: String,
                reflect: true,
            },
        };
    }
    willUpdate(changedProps) {
        // console.log(changedProps)
        if (changedProps.has('volume')) {
            // const oldValue = changedProps.get('volume');
            if (!this.volume || this.volume < 0)
                this.volume = 0;
            else if (this.volume > 1)
                this.volume = 1;
        }
    }
    render() {
        var _a;
        const numToColor = Math.round(this.count * ((_a = this.volume) !== null && _a !== void 0 ? _a : 0));
        return html `
      <style>
        .target{
          width: calc(${100 / this.count}% - 10px);
          height: 10px;
          display: inline-block;
          margin: 5px;
          background-color: #e6e7e8;
        }

        .active {
          background-color: ${this.backgroundColor};
        }
        
      </style>

        <div id="wrapper">
          ${Array.from({ length: this.count }, (_, i) => html `<div class=${i < numToColor ? 'target active' : 'target'}></div>`)}
        </div>
    `;
    }
}
customElements.define('brainsatplay-audio-volume', Volume);
