import { LitElement, html, renderAttributes } from '@polymer/lit-element';
import { audioIcon } from './my-icons.js';

class ACard extends LitElement {
  _render(props) {
    renderAttributes(this, {
      'correct': props._isAnswered && props._correct,
      'incorrect': props._isAnswered && !props._correct
    });

    return html`
    <style>
      :host {
        display: block;
        min-height: 300px;
        text-align: center;
        border-radius: 3px;
        background: white;
        box-shadow: 0 3px 4px 0 rgba(0, 0, 0, 0.14),
           0 1px 8px 0 rgba(0, 0, 0, 0.12),
           0 3px 3px -2px rgba(0, 0, 0, 0.4);
        padding: 20px;
       }
       .question {
         font-size: 4.5em;
         font-weight: bold;
         xfont-family: "Noto Sans Japanese";
       }
       .category {
         font-size: 1em;
         color: #1976D2;
       }
       input {
         font-size: 3rem;
         background: none;
         color: black;
         box-shadow: none;
         border: 0;
         padding: 0;
         border-bottom: 2px solid #E4E4E4;
         width: 100%;
         text-align: center;
       }
       button {
         box-shadow: none;
         border: none;
         cursor: pointer;
       }
       button.green {
         background: #8BC34A;
         color: black;
         font-size: 1em;
         text-transform: uppercase;
         font-weight: bold;
         letter-spacing: 1px;
         padding: 8px 18px;
         margin: 36px 0;
         border-radius: 4px;
       }
       button.say {
         background: transparent;
         vertical-align: middle;
       }
       :host([correct]) {
        outline: 20px solid #64D989;
        outline-offset: -20px;
       }
       :host([incorrect]) {
        outline: 20px solid #E9404B;
        outline-offset: -20px;
       }
     </style>

     <div class="question">${props.question}</div>
     <input autofocus
        title="your answer"
        autocomplete="off" spellcheck="false"
        autocorrect="off" autocapitalize="none"
        placeholder="${props.showAnswer ? props.answer : 'answer'}"
        on-keypress="${(e) => this._inputKeypress(e)}"
        value="${props._inputValue}">
     <div class="category">
       ${props.category}
       <button class="say"
          hidden?="${!props._hasSpeechSynthesis}"
          on-click="${() => this._say()}">
          ${audioIcon}
      </button>
     </div>
     <button class="green" on-click="${() => this.submit()}">${props._isAnswered ? 'next' : 'submit'}</button>
    `;
  }

  static get properties() {
    return {
      // What's being displayed.
      question: String,
      category: String,
      answer: String,
      // State of the card.
      _isAnswered: String,
      _correct: Boolean,
      // App settings.
      showAnswer: Boolean,
      saySettings: String,
      // Private vars to make things easier.
      _hasSpeechSynthesis: Boolean,
      _inputValue: String
    }
  }

  constructor() {
    super();
    this._isAnswered = false;
  }
  _firstRendered() {
    // Save these for later;
    this._button = this.shadowRoot.querySelector('button.green');
    this._input = this.shadowRoot.querySelector('input');

    if (!'speechSynthesis' in window) {
      this._hasSpeechSynthesis = false;
    } else {
      speechSynthesis.onvoiceschanged = () => {
        this._voice = this._getVoice(speechSynthesis.getVoices());
      }
      this._voice = this._getVoice(speechSynthesis.getVoices());
    }
  }

  _didRender(properties, changeList) {
    if ('question' in changeList && this.saySettings === 'start') {
      this._say();
    }
  }

  _getVoice(voices) {
    this._hasSpeechSynthesis = true;

    // In Chrome?
    let voice = speechSynthesis.getVoices().filter((voice) => voice.name === 'Google 日本語')[0];
    if (voice) return voice;
    // On a Mac?
    voice = speechSynthesis.getVoices().filter((voice) => voice.name === 'Kyoko')[0];
    if (voice) return voice;

    // I can't find a voice that reads Japanese on Windows
    this._hasSpeechSynthesis = false;
  }

  submit() {
    if (this._isAnswered) {  // next answer
      this._inputValue = '';
      this._input.focus();
      this.dispatchEvent(new CustomEvent('next-question',
        {bubbles: true, composed: true}));
    } else {  // submit answer
      this._correct = this._input.value === this.answer;
      this._inputValue = this.answer;
      this._button.focus();

      if (this.saySettings === 'end') {
        this._say();
      }

      this.dispatchEvent(new CustomEvent('answered',
        {bubbles: true, composed: true, detail: {correct: this._correct}}));
    }
    this._isAnswered = !this._isAnswered;
  }

  _say() {
    if (!this._voice) {
      return;
    }
    var msg = new SpeechSynthesisUtterance();
    msg.text = this.question;
    msg.lang = 'jp';
    msg.voice = this._voice;
    window.speechSynthesis.speak(msg);
  }

  _inputKeypress(e) {
    if (e.keyCode == 13) { // enter key
      this.submit();
    }
  }
}
window.customElements.define('a-card', ACard);
