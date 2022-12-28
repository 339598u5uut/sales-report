import React, { useState, useMemo, useCallback } from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-enterprise';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-alpine.css';
import { API, token, DETAILS, photo } from './api';
import './index.css';

const App = () => {

  const date = new Date();
  const formatData = day =>
    day.toISOString().replace(/T.*/, '').split('-').join('-');
  const [rowData, setRowData] = useState(null);
  const [details, setDetails] = useState(null);
  const [imagesSrc, setImagesSrc] = useState(null);
  const allInfo = [];
  const todayFormat = formatData(date);
  const dateBefore = new Date(date.getTime() - (7 * 24 * 60 * 60 * 1000));//неделя
  const dateBeforeFormat = formatData(dateBefore);


  const checkResponse = res => {
    if (!res.ok) {
      throw new Error('Сервер не отвечает');
    }
    return res.json();
  };


  const onGridReady = useCallback(() => {

    fetch(`${API}?key=${token}&dateFrom=${dateBeforeFormat}&dateTo=${todayFormat}`)
      .then(checkResponse)
      .then(rowData => {
        setRowData(rowData);
        const allId = rowData?.map(el => { return el['nm_id'] });
        const uniqueId = Array.from(new Set(allId));

        const srcImages = uniqueId?.map((id) => `${photo}${id.toString().slice(0, -5)}/part${id.toString().slice(0, -3)}/${id}/images/c246x328/1.jpg`);
        setImagesSrc(srcImages);
        return uniqueId;
      })
      .then((uniqueId) => {
        const arrayDetails = [];
        Promise.all(uniqueId?.map((url) => fetch(`${DETAILS}&nm=${url}`)
          .then(checkResponse)
          .then(details => {
            arrayDetails.push(details.data.products[0]);
            setDetails(arrayDetails);
          }
          )))
      })
      .catch((error) => {
        console.log(error, 'error')
      });
  }, [dateBeforeFormat, todayFormat]);


  details?.map((det) => {
    imagesSrc?.map((el) => {
      if (el?.includes(det['id'])) {
        det.image = el;
      }
    })
  });


  rowData?.map(obj => {
    details?.map(det => {
      if (obj['nm_id'] === det['id']) {
        allInfo.push({ ...obj, ...det })
      }
    })
  });


  const [columnDefs, setColumnDefs] = useState([
    {
      headerName: 'Фото',
      field: 'image',
      width: 100,
      cellRenderer: params => {
        return <img alt='фото' src={params.value} width='22px' height='33px' />
      },
      aggFunc: 'first',
      lockPosition: 'left',
      checkboxSelection: true,
      filter: false,
    },
    {
      headerName: 'SKU',
      field: 'nm_id',
      rowGroup: true,
      hide: true,
    },
    {
      headerName: 'Название',
      field: 'name',
      aggFunc: 'first',
      filter: true,
    },
    {
      headerName: 'Бренд',
      field: 'brand',
      aggFunc: 'first',
      filter: true,
    },
    {
      headerName: 'Наличие',
      field: 'quantity',
      aggFunc: 'sum',
      filter: true,
    },
    {
      headerName: 'Цена',
      field: 'priceU',
      aggFunc: 'first',
      valueFormatter: "x.toLocaleString() + ' ' + '₽'",
      filter: true,
    },
    {
      headerName: 'Продаж',
      field: 'sale',
      aggFunc: 'sum',
      filter: true,
    },
    {
      headerName: 'Выручка',
      field: 'priceU',
      minWidth: 140,
      aggFunc: 'sum',
      filter: true,
      valueFormatter: "x.toLocaleString() + ' ' + '₽'",
      sort: 'desc',
    },
    {
      headerName: 'График продаж',
      field: 'promotions',
      minWidth: 180,
      aggFunc: 'first',
      cellRenderer: 'agSparklineCellRenderer',
      cellRendererParams: {
        sparklineOptions: {
          type: 'column',
          fill: '#2C9A4F',
          stroke: '#91cc75',
          highlightStyle: {
            fill: 'orange'
          },
          paddingInner: 0.3,
          paddingOuter: 0.1,
          yKey: 'promotions',
          axis: {
            type: 'number',
          },
        },
      },
      filter: false,
    },
  ]);


  const defaultColDef = useMemo(() => {
    return {
      width: 120,
      floatingFilter: true,
      resizable: true,
      sortable: true,
      filter: true,
    };
  }, []);

  const autoGroupColumnDef = useMemo(() => {
    return {
      headerName: 'SKU',
      minWidth: 180,
      filter: true,
      filterValueGetter: (params) => {
        const colId = params.column.colId;
        if (colId.includes('nm_id')) {
          return params.data.nm_id;
        }
      }
    };
  }, []);

  const sideBar = useMemo(() => {
    return {
      toolPanels: [
        'columns',
        'filters',
        {
          id: 'settings',
          labelKey: 'settings',
          labelDefault: 'Settings',
          iconKey: 'menu',
          toolPanel: 'agFiltersToolPanel',
        },
        {
          id: 'help',
          labelKey: 'help',
          labelDefault: 'Help',
          iconKey: 'first',
          toolPanel: 'agFiltersToolPanel',
        },
      ],
      defaultToolPanel: 'columns',
    };
  }, []);

  return (
    <div>
      <div id="myGrid" className="ag-theme-alpine"
        style={{ width: '100vw', height: 700 }}>

        <AgGridReact
          rowData={allInfo}
          columnDefs={columnDefs}
          defaultColDef={defaultColDef}
          autoGroupColumnDef={autoGroupColumnDef}
          groupDisplayType={'singleColumn'}
          animateRows={true}
          onGridReady={onGridReady}
          suppressAggFuncInHeader={true}
          sideBar={sideBar}
        />
      </div>
    </div>
  );
};

export default App;
