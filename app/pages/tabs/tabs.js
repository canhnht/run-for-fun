import {Page} from 'ionic-angular';
import {Map} from '../map/map';
import {Page2} from '../page2/page2';


@Page({
  templateUrl: 'build/pages/tabs/tabs.html'
})
export class TabsPage {
  constructor() {
    // this tells the tabs component which Pages
    // should be each tab's root Page
    this.tab1Root = Map;
    this.tab2Root = Page2;
  }
}
