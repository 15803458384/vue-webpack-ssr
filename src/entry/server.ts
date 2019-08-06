/**
 * This file is part of the haiman.
 * @copyright Copyright (c) 2018 Hangzhou Haila Information Technology Co., Ltd
 * @author William Chan <root@williamchan.me>
 * @notice Server 入口文件，注意性能，API和utils是单例，需要注入请求参数。
 */
/* eslint no-param-reassign: ["error", { "props": false }] */

import createApp from '@/entry/main';
import { HttpRedirectException } from '@/utils/http/redirect';
import {
  UnknownHttpException,
  UnauthorizedHttpException,
  NotFoundHttpException,
  ForbiddenHttpException,
  ServerErrorHttpException,
  HttpException,
} from '@/utils/http/error';

// import { setApiParams } from '$api'; // eslint-disable-line
// import { AUTH_URL, ROUTER_BASE } from '@/config';
// import { setUtilParams } from '@/utils';

const createError = (msg, obj = {}): Error => {
  const err = new Error(msg);
  Object.assign(err, obj);
  return err;
};

// eslint-disable-next-line no-async-promise-executor
export default context => new Promise(async (resolve, reject) => {
  const { request } = context;

  // context.rendered = (c) => {
  //   console.log(c);
  // };
  // context.rendered(() => {
  //   console.log(123);
  // });
  // setUtilParams(request);
  const { app, router, store } = createApp();
  let { url } = context;
  if (url.indexOf('') === 0) {
    url = url.substr(0);
  }
  const { fullPath } = router.resolve(url).route;
  if (fullPath !== url) {
    return reject(new HttpRedirectException(fullPath));
  }
  // setApiParams(request);
  const { route } = router.resolve(url);
  const requiresAuth = route.matched.some(record => record.meta.requiresAuth);
  const ignoreAuth = route.matched.some(record => record.meta.ignoreAuth);
  // if (!ignoreAuth) {
  //   try {
  //     await store.dispatch('user/GET_USER');
  //   } catch (err) {
  //     if (requiresAuth) {
  //       return reject(createError({ url: `${AUTH_URL}?redirect_uri=${encodeURIComponent(context.url)}` }));
  //     }
  //   }
  // }
  router.push(url);
  return router.onReady(async () => {
    const matchedComponents = router.getMatchedComponents();
    if (!matchedComponents.length) {
      return reject(new NotFoundHttpException());
    }
    // setApiParams(request);
    // setUtilParams(request);
    try {
      await Promise.all(matchedComponents.map((c: any) => c.asyncData && c.asyncData({
        store,
        route: router.currentRoute,
      })));
      // TODO api 做成多例后 在这里应该 unset
      context.state = store.state;
      return resolve(app);
    } catch (err) {
      if (err instanceof UnauthorizedHttpException) {
        return reject(new HttpRedirectException(
          'TODO AUTH_URL',
          // `${AUTH_URL}?redirect_uri=${encodeURIComponent(context.url)}`,
        ));
      }
      return reject(err);
    }
  });
});
