import React from 'react'
import moment from 'moment'
import { ListUl } from '@styled-icons/boxicons-regular/ListUl'
import { Download } from '@styled-icons/boxicons-regular/Download'
import { Chat } from '@styled-icons/boxicons-solid/Chat'
import List from './List'
import Text from './Text'

const TorrentList = ({ torrents, categories }) => (
  <List
    data={torrents.map((torrent) => ({
      ...torrent,
      href: `/torrent/${torrent.infoHash}`,
    }))}
    columns={[
      {
        accessor: 'name',
        cell: ({ value }) => <Text>{value}</Text>,
        gridWidth: '2fr',
      },
      {
        accessor: 'type',
        cell: ({ value }) => (
          <Text icon={ListUl}>
            {categories.find((c) => c.slug === value).name}
          </Text>
        ),
        gridWidth: '2fr',
      },
      {
        accessor: 'downloads',
        cell: ({ value }) => <Text icon={Download}>{value}</Text>,
        gridWidth: '1fr',
      },
      {
        accessor: 'comments.count',
        cell: ({ value }) => <Text icon={Chat}>{value}</Text>,
        gridWidth: '1fr',
      },
      {
        accessor: 'created',
        cell: ({ value }) => (
          <Text textAlign="right">{moment(value).format('Do MMM YYYY')}</Text>
        ),
        gridWidth: '1fr',
      },
    ]}
  />
)

export default TorrentList
