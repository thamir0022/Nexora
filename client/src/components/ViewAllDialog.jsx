import React, { useEffect, useRef, useState } from 'react'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog'
import { Input } from './ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { DataTable } from './datatable'
import { Button } from './ui/button'
import useAxiosPrivate from '@/hooks/useAxiosPrivate'
import { ScrollArea } from './ui/scroll-area'
import { jsPDF } from 'jspdf'
import { applyPlugin } from 'jspdf-autotable'


function ViewAllDialog({ title, api, defaultFilters, columns, dataKey = "result", ref }) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState({
    sort: "desc",
    search: "",
    status: "",
    ...defaultFilters,
  })

  const targetRef = useRef(null)
  applyPlugin(jsPDF)
  const handlePdfDownload = () => {
    const doc = new jsPDF()
    doc.autoTable({ html: targetRef.current })
    doc.save('table.pdf')
  }

  const axios = useAxiosPrivate();

  const fetchData = async () => {
    setLoading(true)
    try {
      const response = await axios.get(api, { params: filters })
      setData(response.data[dataKey]);
    } catch (err) {
      console.error(err)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [filters])


  return (
    <Dialog className="">
      <DialogTrigger>
        <Button>View All</Button>
      </DialogTrigger>
      <DialogContent className="w-[90vw]! max-w-none!">
        <DialogHeader>
          <DialogTitle className="text-xl text-center">{title}</DialogTitle>
          <div className="flex justify-between">
            <div className="flex gap-3">
              <Input
                className="w-96"
                placeholder="Search..."
                value={filters.search}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, search: e.target.value, page: 1 }))
                }
              />

              {defaultFilters && (
                <Select onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value, page: 1 }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    {defaultFilters.map((filter, idx) => (
                      <SelectItem key={idx} value={filter.value}>
                        {filter.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
            <Button onClick={() => handlePdfDownload()}>Export to PDF</Button>
          </div>
        </DialogHeader>

        <ScrollArea className="h-[500px] border rounded-md overflow-hidden">
          <DataTable ref={targetRef} columns={columns} data={data} isLoading={loading} />
        </ScrollArea>
        <DialogFooter>
          <DialogClose>
            <Button>Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default ViewAllDialog
