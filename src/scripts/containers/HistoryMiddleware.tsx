import {
    createBrowserHistory,
    History,
    LocationDescriptorObject
} from 'history';
import { AppCoreContext } from '../app';
import * as React from 'react';
import { withContext, WithContextProps } from 'react-context-service';

interface HistoryMiddlewareOwnProps {
    readonly children: () => React.ReactNode;
}

type HistoryMiddlewareProps = WithContextProps<AppCoreContext, HistoryMiddlewareOwnProps>;

class HistoryMiddleware extends React.PureComponent<HistoryMiddlewareProps> {
    constructor(props: HistoryMiddlewareProps) {
        super(props);
        const { setContext } = props;

        setContext({
            history: this.createHistory()
        });
    }
    
    public render() {
        const { history, children } = this.props;

        if (!history) {
            return null;
        }

        return children();
    }

    private readonly createHistoryMiddleware = (history: History<{}>) => {
        const originPush = history.push;
        const originReplace = history.replace;

        const nextReplace = function () {
            originReplace.apply(window, arguments);
        };

        const $self = this;

        return {
            push: function (next: string | LocationDescriptorObject<{}>) {
                const nextUrl = typeof next === 'string' ? next : next.pathname!;
                const currentUrl = location.pathname + location.search;
                if (nextUrl === currentUrl) {
                    return;
                }

                const { currentUserRole } = $self.props;

                const isRedirect = (currentUserRole && currentUserRole.redirects) &&
                    currentUserRole.redirects.find(r => r.test.test(nextUrl));

                if (isRedirect) {
                    originPush.apply(window, [isRedirect.target]);
                    return;
                }

                originPush.apply(window, arguments);
            },
            replace: nextReplace
        };
    }

    private readonly applyHistoryMiddeware = (history: History<{}>, middleWares: {}) => {
        for (const middleWareKey in middleWares) {
            if (!history.hasOwnProperty(middleWareKey)) {
                continue;
            }

            history[middleWareKey] = middleWares[middleWareKey];
        }

        return history;
    }

    private readonly createHistory = () => {
        const history = createBrowserHistory();
        const middleWares = this.createHistoryMiddleware(history);
        return this.applyHistoryMiddeware(history, middleWares);
    }
}

export default withContext<AppCoreContext, HistoryMiddlewareOwnProps>(
    'history',
    'currentUserRole'
)(HistoryMiddleware);