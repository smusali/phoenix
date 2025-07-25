import { ReactNode, Suspense, useCallback, useState } from "react";
import { graphql, useLazyLoadQuery } from "react-relay";
import { useNavigate } from "react-router";

// eslint-disable-next-line deprecate/import
import { ActionMenu, Dialog, DialogContainer, Item } from "@arizeai/components";

import { Flex, Heading, Icon, Icons, Loading, View } from "@phoenix/components";
import { CreateDatasetForm } from "@phoenix/components/dataset/CreateDatasetForm";
import { useNotifyError, useNotifySuccess } from "@phoenix/contexts";
import { getErrorMessagesFromRelayMutationError } from "@phoenix/utils/errorUtils";

import { DatasetsPageQuery } from "./__generated__/DatasetsPageQuery.graphql";
import { DatasetsTable_datasets$key } from "./__generated__/DatasetsTable_datasets.graphql";
import { DatasetFromCSVForm } from "./DatasetFromCSVForm";
import { DatasetsSearch } from "./DatasetsSearch";
import { DatasetsTable } from "./DatasetsTable";

export function DatasetsPage() {
  return (
    <Suspense fallback={<Loading />}>
      <DatasetsPageContent />
    </Suspense>
  );
}

export function DatasetsPageContent() {
  const [fetchKey, setFetchKey] = useState(0);
  const data = useLazyLoadQuery<DatasetsPageQuery>(
    graphql`
      query DatasetsPageQuery {
        ...DatasetsTable_datasets
      }
    `,
    {},
    {
      fetchKey: fetchKey,
      fetchPolicy: "store-and-network",
    }
  );

  const onDatasetCreated = useCallback(() => {
    setFetchKey((prev) => prev + 1);
  }, [setFetchKey]);

  return (
    <Flex direction="column" height="100%">
      <View
        padding="size-200"
        borderBottomWidth="thin"
        borderBottomColor="dark"
        flex="none"
      >
        <Flex direction="column" gap="size-200">
          <Flex
            direction="row"
            justifyContent="space-between"
            alignItems="center"
          >
            <Heading level={1}>Datasets</Heading>
            <CreateDatasetActionMenu onDatasetCreated={onDatasetCreated} />
          </Flex>
        </Flex>
      </View>
      <DatasetsTableWithSearch query={data} />
    </Flex>
  );
}

// New component that manages filter state locally
function DatasetsTableWithSearch({
  query,
}: {
  query: DatasetsTable_datasets$key;
}) {
  const [filter, setFilter] = useState<string>("");

  return (
    <>
      <View
        padding="size-200"
        flex="none"
        borderBottomWidth="thin"
        borderBottomColor="dark"
      >
        <DatasetsSearch onChange={setFilter} value={filter} />
      </View>
      <DatasetsTable query={query} filter={filter} />
    </>
  );
}

type CreateDatasetActionMenu = {
  onDatasetCreated: () => void;
};

enum CreateDatasetAction {
  NEW = "newDataset",
  FROM_CSV = "datasetFromCSV",
}

function CreateDatasetActionMenu({
  onDatasetCreated,
}: CreateDatasetActionMenu) {
  const navigate = useNavigate();
  const notifySuccess = useNotifySuccess();
  const notifyError = useNotifyError();
  const [dialog, setDialog] = useState<ReactNode>(null);
  const onCreateDataset = () => {
    setDialog(
      <Dialog size="S" title="New Dataset">
        <CreateDatasetForm
          onDatasetCreated={(newDataset) => {
            notifySuccess({
              title: "Dataset created",
              message: `${newDataset.name} has been successfully created.`,
              action: {
                text: "Go to Dataset",
                onClick: () => {
                  navigate(`/datasets/${newDataset.id}`);
                },
              },
            });
            setDialog(null);
            onDatasetCreated();
          }}
          onDatasetCreateError={(error) => {
            const formattedError =
              getErrorMessagesFromRelayMutationError(error);
            notifyError({
              title: "Dataset creation failed",
              message: formattedError?.[0] ?? error.message,
            });
          }}
        />
      </Dialog>
    );
  };
  const onCreateDatasetFromCSV = () => {
    setDialog(
      <Dialog size="M" title="New Dataset from CSV">
        <DatasetFromCSVForm
          onDatasetCreated={(newDataset) => {
            notifySuccess({
              title: "Dataset created",
              message: `${newDataset.name} has been successfully created.`,
              action: {
                text: "Go to Dataset",
                onClick: () => {
                  navigate(`/datasets/${newDataset.id}`);
                },
              },
            });
            setDialog(null);
            onDatasetCreated();
          }}
          onDatasetCreateError={(error) => {
            const formattedError =
              getErrorMessagesFromRelayMutationError(error);
            notifyError({
              title: "Dataset creation failed",
              message: formattedError?.[0] ?? error.message,
            });
          }}
        />
      </Dialog>
    );
  };
  return (
    <>
      <ActionMenu
        buttonText="Create Dataset"
        align="end"
        icon={<Icon svg={<Icons.DatabaseOutline />} />}
        onAction={(action) => {
          switch (action) {
            case CreateDatasetAction.NEW:
              onCreateDataset();
              break;
            case CreateDatasetAction.FROM_CSV:
              onCreateDatasetFromCSV();
              break;
          }
        }}
      >
        <Item key={CreateDatasetAction.NEW}>New Dataset</Item>
        <Item key={CreateDatasetAction.FROM_CSV}>Dataset from CSV</Item>
      </ActionMenu>
      <DialogContainer
        type="modal"
        isDismissable
        onDismiss={() => setDialog(null)}
      >
        {dialog}
      </DialogContainer>
    </>
  );
}
