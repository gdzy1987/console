/*
 * This file is part of KubeSphere Console.
 * Copyright (C) 2019 The KubeSphere Console Authors.
 *
 * KubeSphere Console is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * KubeSphere Console is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with KubeSphere Console.  If not, see <https://www.gnu.org/licenses/>.
 */

import React from 'react'
import { observer, inject } from 'mobx-react'
import { capitalize } from 'lodash'

import { Status, Banner } from 'components/Base'
import Base from 'core/containers/Base/List'
import Avatar from 'apps/components/Avatar'
import { getLocalTime } from 'utils'

import { getAppCategoryNames, transferAppStatus } from 'utils/app'
import AppStore from 'stores/openpitrix/store'

@inject('rootStore')
@observer
export default class Store extends Base {
  init() {
    this.store = new AppStore()
  }

  get authKey() {
    return 'apps'
  }

  get name() {
    return 'Apps'
  }

  get rowKey() {
    return 'app_id'
  }

  getTableProps() {
    return {
      ...Base.prototype.getTableProps.call(this),
      onCreate: null,
      selectActions: [],
    }
  }

  getColumns = () => [
    {
      title: t('Name'),
      dataIndex: 'name',
      width: '30%',
      render: (name, app) => (
        <Avatar
          isApp
          to={`/apps-manage/store/${app.app_id}`}
          avatar={app.icon}
          iconLetter={name}
          iconSize={40}
          title={name}
          desc={app.description}
        />
      ),
    },
    {
      title: t('Status'),
      dataIndex: 'status',
      isHideable: true,
      width: '10%',
      render: status => (
        <Status type={status} name={t(capitalize(transferAppStatus(status)))} />
      ),
    },
    {
      title: t('Provider'),
      dataIndex: 'isv',
      isHideable: true,
      width: '10%',
    },
    {
      title: t('Latest Version'),
      dataIndex: 'latest_app_version.name',
      isHideable: true,
      width: '16%',
    },
    {
      title: t('App Category'),
      dataIndex: 'category_set',
      isHideable: true,
      width: '17%',
      render: categories => getAppCategoryNames(categories),
    },
    {
      title: t('Release / Suspended Time'),
      dataIndex: 'status_time',
      isHideable: true,
      width: '17%',
      render: time => getLocalTime(time).fromNow(),
    },
  ]

  renderHeader() {
    return (
      <Banner
        type="white"
        icon="appcenter"
        name={t('App Store')}
        desc={t('APP_STORE_DESC')}
      />
    )
  }
}
