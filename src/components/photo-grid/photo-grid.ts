import {Component, Input, OnInit} from "@angular/core";
import {Events} from "ionic-angular";
import {GalleryProvider} from "../../providers/gallery";
import {IonicUtilProvider} from "../../providers/ionic-util";
import {IParams} from "../../models/parse.params.model";
import _ from "underscore";

@Component({
    selector   : 'photo-grid',
    templateUrl: 'photo-grid.html'
})
export class PhotoGridComponent implements OnInit {

    @Input() username?: string;
    @Input() event: string;

    params: IParams = {
        limit: 15,
        page : 1
    };

    errorIcon: string      = 'ios-images-outline';
    errorText: string      = '';
    loading: boolean       = true;
    showEmptyView: boolean = false;
    showErrorView: boolean = false;
    data                   = [];
    _width: any;

    constructor(private provider: GalleryProvider,
                private events: Events,
                private util: IonicUtilProvider
    ) {

        this._width = util._widthPlatform / 3 + 'px';
    }

    ngOnInit() {
        // Cache Request
        this.events.subscribe(this.event + ':cache', (params: IParams) => {
            console.info(this.event + ':cache', params);
            this.params = params;
            this.cache();
        });

        // Server Request
        this.events.subscribe(this.event + ':params', (params: IParams) => {
            console.info(this.event + ':params', params);
            this.params = params;
            this.feed();
        });

        // Reload
        this.events.subscribe(this.event + ':reload', () => {
            console.info(this.event + ':reload');
            this.params.page = 1;
            this.data        = []
            // Clean Cache and Reload
            this.provider.cleanCache()
                .then(() => this.feed())
                .then(this.provider.feedCache)
                .then(() => this.events.publish('scroll:up'))
                .catch(console.error);
            ;
        });
    }

    ionViewDidLoad() {
        console.info('ionViewDidLoad photolist');
    }

    ionViewWillEnter() {
        console.info('ionViewWillEnter photolist');
    }

    ionViewDidLeave() {
        console.info('ionViewDidLeave photolist');
    }

    private feed(): Promise<any> {
        console.log('Load Feed', this.params, this.loading);

        return new Promise((resolve, reject) => {
            if (this.params.page == 1) {
                this.data    = [];
                this.loading = true;
            }

            this.provider.feed(this.params).then(data => {
                console.info(data);
                if (data) {
                    _.sortBy(data, 'createdAt').reverse().map(item => this.data.push(item));
                    this.events.publish(this.event + ':moreItem', true);
                } else {
                    this.showEmptyView = false;
                }
                this.loading = false;
                this.events.publish(this.event + ':complete', null);
                resolve(data);
            }).catch(error => {
                this.errorText     = error.message;
                this.showErrorView = true;
                this.loading       = false;
                this.events.publish(this.event + ':complete', null);
                reject(error);
            });
        });
    }

    private cache(): void {
        console.log('Load cache', this.params);
        this.provider.findCache(this.params).then(_data => {
            console.log('cache', _data);
            if (_data.length) {
                _.sortBy(_data, 'createdAt').reverse().map(item => this.data.push(item));
                this.loading = false;
                this.events.publish(this.event + ':moreItem', true);
            } else {
                this.feed();
            }
        });
    }

    public doTry(): void {
        this.showErrorView = false;
        this.feed();
    }

}
